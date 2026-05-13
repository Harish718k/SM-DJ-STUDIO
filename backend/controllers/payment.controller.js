const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-intent
// Body  : { bookingId: string, amount: number }  — amount in dollars
// Access: Protected (JWT)
// ─────────────────────────────────────────────────────────────────────────────
exports.createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return errorResponse(res, 'bookingId and amount are required', 400);
    }

    const amountInCents = Math.round(Number(amount) * 100);
    if (isNaN(amountInCents) || amountInCents < 50) {
      return errorResponse(res, 'Invalid amount — must be at least INR 0.50', 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Clients can only pay for their own bookings
    if (req.user.role === 'client' && booking.client.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to pay for this booking', 403);
    }

    if (booking.depositPaid) {
      return errorResponse(res, 'Deposit for this booking has already been paid', 409);
    }

    // Create the PaymentIntent on Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount:                    amountInCents,
      currency:                  'inr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: bookingId.toString(),
        clientId:  req.user.id.toString(),
        eventType: booking.eventType,
        eventDate: booking.eventDate.toISOString().split('T')[0],
      },
      description: `Deposit — DJ BookPro ${booking.eventType} on ${
        booking.eventDate.toISOString().split('T')[0]
      }`,
    });

    // Persist the intent ID for later verification in confirm-payment
    booking.stripePaymentIntentId = paymentIntent.id;
    await booking.save();

    return successResponse(
      res,
      { clientSecret: paymentIntent.client_secret },
      'Payment intent created',
      201,
    );
  } catch (err) {
    if (err.type?.startsWith('Stripe')) {
      return errorResponse(res, `Stripe error: ${err.message}`, 402);
    }
    return errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/confirm-payment
// Body  : { bookingId: string, paymentIntentId: string }
// Access: Protected (JWT)
//
// Called by the frontend AFTER stripe.confirmPayment() resolves successfully.
// Retrieves the intent directly from Stripe (no webhook needed), verifies
// status === 'succeeded', then marks depositPaid = true and status = 'confirmed'.
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;

    if (!bookingId || !paymentIntentId) {
      return errorResponse(res, 'bookingId and paymentIntentId are required', 400);
    }

    // Ask Stripe directly — this is the source of truth for dev purposes
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== 'succeeded') {
      return errorResponse(
        res,
        `Payment not completed. Stripe status: ${intent.status}`,
        402,
      );
    }

    // Guard: ensure this intent was created for this exact booking
    if (intent.metadata?.bookingId !== bookingId.toString()) {
      return errorResponse(res, 'Payment intent does not match this booking', 403);
    }

    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { depositPaid: true, status: 'confirmed' },
      { new: true },
    ).populate(['client', 'package']);

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    return successResponse(res, booking, 'Payment confirmed — booking updated');
  } catch (err) {
    if (err.type?.startsWith('Stripe')) {
      return errorResponse(res, `Stripe error: ${err.message}`, 402);
    }
    return errorResponse(res, err.message);
  }
};

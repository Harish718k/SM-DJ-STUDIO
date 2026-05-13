/**
 * booking.controller.js
 * backend/controllers/booking.controller.js
 *
 * Key fix: getMyBookings and getBooking now normalise reviewStatus.
 * Old documents created before the Booking model migration don't have
 * a reviewStatus field at all — Mongoose returns undefined for those.
 * We use .lean() + a map pass to coerce undefined → 'none' so the
 * frontend *ngIf="canReview(b)" condition works correctly for every booking.
 */

const stripe      = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking     = require('../models/Booking.model');
const { Package } = require('../models/Package.model');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { checkAvailability } = require('../services/availability.service');
const emailService = require('../services/email.service');

/** Coerce missing reviewStatus to 'none' for pre-migration documents */
function normaliseReviewStatus(booking) {
  if (!booking.reviewStatus) booking.reviewStatus = 'none';
  return booking;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings   — create booking + Stripe PaymentIntent
// ─────────────────────────────────────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const {
      packageId, eventType, eventDate,
      startTime, endTime, venue, guestCount, specialRequests,
    } = req.body;

    const pkg = await Package.findById(packageId);
    if (!pkg || !pkg.isActive) {
      return errorResponse(res, 'Package not found or unavailable', 404);
    }

    const available = await checkAvailability(eventDate);
    if (!available) {
      return errorResponse(res, 'The selected date is not available', 409);
    }

    const depositAmount = Math.round(pkg.basePrice * 0.3);

    // Create Stripe PaymentIntent before DB write so failures don't orphan bookings
    const paymentIntent = await stripe.paymentIntents.create({
      amount:                    depositAmount * 100,
      currency:                  'inr',
      automatic_payment_methods: { enabled: true },
      metadata: {
        clientId:  req.user.id.toString(),
        eventType,
        eventDate: new Date(eventDate).toISOString().split('T')[0],
      },
    });

    const booking = await Booking.create({
      client:               req.user.id,
      package:              packageId,
      eventType,
      eventDate:            new Date(eventDate),
      startTime,
      endTime,
      venue,
      guestCount,
      specialRequests,
      totalPrice:           pkg.basePrice,
      depositAmount,
      stripePaymentIntentId: paymentIntent.id,
      status:               'awaiting_payment',
      reviewStatus:         'none',
    });

    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: { ...paymentIntent.metadata, bookingId: booking._id.toString() },
    });

    await booking.populate(['client', 'package']);

    return successResponse(res, {
      bookingId:    booking._id,
      clientSecret: paymentIntent.client_secret,
      depositAmount,
      totalPrice:   pkg.basePrice,
    }, 'Booking created — awaiting payment', 201);

  } catch (err) {
    if (err.type?.startsWith('Stripe')) {
      return errorResponse(res, `Stripe error: ${err.message}`, 402);
    }
    return errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings/:id/confirm   — verify Stripe + finalise booking
// ─────────────────────────────────────────────────────────────────────────────
exports.confirmBookingPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(['client', 'package']);
    if (!booking) return errorResponse(res, 'Booking not found', 404);

    if (req.user.role === 'client' && booking.client._id.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    if (booking.status !== 'awaiting_payment') {
      return successResponse(res, booking, 'Booking already confirmed');
    }

    if (!booking.stripePaymentIntentId) {
      return errorResponse(res, 'No payment intent on this booking', 400);
    }

    const intent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
    if (intent.status !== 'succeeded') {
      return errorResponse(res, `Payment not completed. Stripe status: ${intent.status}`, 402);
    }

    booking.status      = 'pending';
    booking.depositPaid = true;
    await booking.save();

    await Promise.allSettled([
      emailService.sendBookingReceived(booking),
      emailService.sendAdminNewBooking(booking),
    ]);

    return successResponse(res, booking, 'Payment confirmed — booking submitted');
  } catch (err) {
    if (err.type?.startsWith('Stripe')) {
      return errorResponse(res, `Stripe error: ${err.message}`, 402);
    }
    return errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings   — admin: all bookings
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status
      ? { status }
      : { status: { $ne: 'awaiting_payment' } };

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('client',  'name email phone')
      .populate('package', 'name basePrice')
      .sort({ eventDate: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    paginatedResponse(res, bookings, total, page, limit);
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/my   — client: own bookings
//
// FIX: uses .lean() then normalises reviewStatus for pre-migration documents.
// Without this, old bookings missing the reviewStatus field return undefined
// and the Angular *ngIf condition never shows the review button.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const rawBookings = await Booking.find({
      client: req.user.id,
      status: { $ne: 'awaiting_payment' },
    })
      .populate('package', 'name basePrice duration features')
      .sort({ eventDate: -1 })
      .lean();

    // Normalise: any booking without reviewStatus gets 'none'
    const bookings = rawBookings.map(normaliseReviewStatus);

    successResponse(res, bookings);
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/:id   — single booking (client or admin)
//
// FIX: normalises reviewStatus for pre-migration documents.
// ─────────────────────────────────────────────────────────────────────────────
exports.getBooking = async (req, res) => {
  try {
    const raw = await Booking.findById(req.params.id)
      .populate('client',  'name email phone')
      .populate('package')
      .lean();

    if (!raw) return errorResponse(res, 'Booking not found', 404);

    if (req.user.role === 'client' && raw.client._id.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized', 403);
    }

    const booking = normaliseReviewStatus(raw);
    successResponse(res, booking);
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/bookings/:id/status   — admin: update status
// ─────────────────────────────────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const booking = await Booking.findById(req.params.id).populate(['client', 'package']);

    if (!booking) return errorResponse(res, 'Booking not found', 404);

    const prevStatus  = booking.status;
    booking.status    = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    await booking.save();

    if (status === 'confirmed'  && prevStatus !== 'confirmed')  await emailService.sendBookingConfirmed(booking);
    if (status === 'cancelled'  && prevStatus !== 'cancelled')  await emailService.sendBookingCancelled(booking);
    if (status === 'completed'  && prevStatus !== 'completed')  await emailService.sendReviewRequest(booking);

    successResponse(res, booking, 'Booking status updated');
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/bookings/:id   — admin: update booking fields
// ─────────────────────────────────────────────────────────────────────────────
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate(['client', 'package']);

    if (!booking) return errorResponse(res, 'Booking not found', 404);
    successResponse(res, booking, 'Booking updated');
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/bookings/:id   — admin: remove booking
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return errorResponse(res, 'Booking not found', 404);
    successResponse(res, null, 'Booking removed');
  } catch (err) {
    errorResponse(res, err.message);
  }
};

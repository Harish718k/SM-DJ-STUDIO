/**
 * review.controller.js
 * backend/controllers/review.controller.js
 */

const Review  = require('../models/Review.model');
const Booking = require('../models/Booking.model');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews
// Guards (in order):
//   1. bookingId present
//   2. Booking exists
//   3. Client owns the booking
//   4. booking.status === 'completed'
//   5. booking.reviewStatus === 'none'  (not already reviewed)
// On success:
//   - Saves Review document
//   - Sets booking.reviewStatus = 'submitted'  ← single source of truth
//   - Returns the populated review
// ─────────────────────────────────────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId) {
      return errorResponse(res, 'bookingId is required', 400);
    }

    // Fetch booking and its package in one query
    const booking = await Booking.findById(bookingId).populate('package');
    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Ownership check
    if (booking.client.toString() !== req.user.id.toString()) {
      return errorResponse(res, 'You are not authorised to review this booking', 403);
    }

    // Must be completed
    if (booking.status !== 'completed') {
      return errorResponse(
        res,
        `Reviews can only be left for completed bookings. Current status: '${booking.status}'`,
        422
      );
    }

    // reviewStatus check — use the Booking field as the fast gate,
    // with the DB unique index as the belt-and-braces fallback
    if (booking.reviewStatus === 'submitted') {
      return errorResponse(res, 'You have already submitted a review for this booking', 409);
    }

    // Create the Review document
    const review = await Review.create({
      client:    req.user.id,
      booking:   bookingId,
      package:   booking.package?._id ?? null,
      eventType: booking.eventType,
      eventDate: booking.eventDate,
      rating,
      comment,
    });

    // ── Mark the booking as reviewed — drives the frontend button state ──────
    booking.reviewStatus = 'submitted';
    await booking.save();

    // Populate for the response
    await review.populate([
      { path: 'client',  select: 'name profilePicture' },
      { path: 'package', select: 'name'                },
    ]);

    return successResponse(res, review, 'Review submitted successfully', 201);

  } catch (err) {
    // Mongoose unique-index race condition
    if (err.code === 11000) {
      return errorResponse(res, 'A review for this booking already exists', 409);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return errorResponse(res, messages.join('. '), 422);
    }
    return errorResponse(res, err.message);
  }
};


// GET /api/reviews/eligible
// Returns completed bookings for the logged-in client that haven't been reviewed
exports.getEligibleBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      client: req.user.id,
      status: 'completed',
      reviewStatus: 'none'
    })
    .populate('package', 'name')
    .sort({ eventDate: -1 });

    return successResponse(res, bookings);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews
// Public — no auth required. Used by the public Reviews page.
// Query params: packageId, eventType, rating, sort, page, limit
// ─────────────────────────────────────────────────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const {
      packageId, eventType, rating,
      page = 1, limit = 12, sort = 'newest',
    } = req.query;

    const filter = { isPublished: true };
    if (packageId) filter.package   = packageId;
    if (eventType) filter.eventType = eventType;
    if (rating)    filter.rating    = Number(rating);

    const sortMap = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
      highest: { rating:    -1 },
      lowest:  { rating:     1 },
    };
    const sortObj   = sortMap[sort] ?? sortMap.newest;
    const pageNum   = Math.max(1, parseInt(page));
    const limitNum  = Math.min(50, Math.max(1, parseInt(limit)));

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('client',  'name profilePicture')
        .populate('package', 'name basePrice')
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return paginatedResponse(res, reviews, total, pageNum, limitNum);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews/my
// Returns the authenticated client's own reviews.
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ client: req.user.id })
      .populate('booking', 'eventType eventDate venue status reviewStatus')
      .populate('package', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, reviews);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reviews/:id  (admin only)
// Soft-delete — sets isPublished = false.
// ─────────────────────────────────────────────────────────────────────────────
exports.unpublishReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isPublished: false },
      { new: true }
    );
    if (!review) return errorResponse(res, 'Review not found', 404);
    return successResponse(res, review, 'Review unpublished');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

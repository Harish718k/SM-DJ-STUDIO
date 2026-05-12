/**
 * booking.routes.js  — FULL REPLACEMENT
 * Adds: POST /:id/confirm  (payment confirmation endpoint)
 */

const express = require('express');
const router  = express.Router();
const {
  createBooking, getAllBookings, getMyBookings,
  getBooking, updateStatus, updateBooking, deleteBooking,
  confirmBookingPayment,
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);  // all booking routes require JWT

router.get('/',      authorize('admin'),           getAllBookings);
router.get('/my',    authorize('client'),           getMyBookings);
router.get('/:id',                                  getBooking);
router.post('/',     authorize('client', 'admin'),  createBooking);

// ── Payment confirmation — called after stripe.confirmPayment() succeeds ──────
router.post('/:id/confirm', authorize('client', 'admin'), confirmBookingPayment);

router.put('/:id/status', authorize('admin'), updateStatus);
router.put('/:id',        authorize('admin'), updateBooking);
router.delete('/:id',     authorize('admin'), deleteBooking);

module.exports = router;

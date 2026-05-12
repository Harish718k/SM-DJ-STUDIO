/**
 * review.routes.js
 * Place at: backend/routes/review.routes.js
 *
 * Mount in server.js:
 *   const reviewRoutes = require('./routes/review.routes');
 *   app.use('/api/reviews', reviewRoutes);
 */

const express = require('express');
const router  = express.Router();
const {
  submitReview,
  getReviews,
  getMyReviews,
  getEligibleBookings,
  unpublishReview,
} = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// ── Public ────────────────────────────────────────────────────────────────────
// No auth needed — used by the public Reviews page
router.get('/', getReviews);

// ── Authenticated clients ─────────────────────────────────────────────────────
router.use(protect);

router.post('/',           authorize('client'),       submitReview);
router.get('/my',          authorize('client'),       getMyReviews);
router.get('/eligible',    authorize('client'),       getEligibleBookings);

// ── Admin only ────────────────────────────────────────────────────────────────
router.delete('/:id',      authorize('admin'),        unpublishReview);

module.exports = router;

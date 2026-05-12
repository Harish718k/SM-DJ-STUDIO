const express = require('express');
const router = express.Router();
const { getSummary, getMonthly, getEventTypes, getUpcoming } = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/summary', getSummary);
router.get('/monthly', getMonthly);
router.get('/event-types', getEventTypes);
router.get('/upcoming', getUpcoming);

module.exports = router;

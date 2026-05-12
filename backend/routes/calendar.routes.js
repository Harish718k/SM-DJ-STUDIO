const express = require('express');
const router = express.Router();
const { getAvailability, blockDate, unblockDate, getBlockedDates } = require('../controllers/calendar.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/availability', getAvailability);
router.post('/block', protect, authorize('admin'), blockDate);
router.delete('/block/:id', protect, authorize('admin'), unblockDate);
router.get('/blocked', protect, authorize('admin'), getBlockedDates);

module.exports = router;

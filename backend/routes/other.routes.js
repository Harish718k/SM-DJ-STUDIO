// ── calendar.routes.js ──────────────────────────────────────────────────────
const express = require('express');
const calRouter = express.Router();
const { getAvailability, blockDate, unblockDate, getBlockedDates } = require('../controllers/calendar.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

calRouter.get('/availability', getAvailability); // Public
calRouter.post('/block', protect, authorize('admin'), blockDate);
calRouter.delete('/block/:id', protect, authorize('admin'), unblockDate);
calRouter.get('/blocked', protect, authorize('admin'), getBlockedDates);

// ── package.routes.js ────────────────────────────────────────────────────────
const pkgRouter = express.Router();
const { getPackages, getAllPackages, createPackage, updatePackage, deletePackage } = require('../controllers/package.controller');

pkgRouter.get('/', getPackages); // Public - active packages
pkgRouter.get('/all', protect, authorize('admin'), getAllPackages);
pkgRouter.post('/', protect, authorize('admin'), createPackage);
pkgRouter.put('/:id', protect, authorize('admin'), updatePackage);
pkgRouter.delete('/:id', protect, authorize('admin'), deletePackage);

// ── analytics.routes.js ──────────────────────────────────────────────────────
const analyticsRouter = express.Router();
const { getSummary, getMonthly, getEventTypes, getUpcoming } = require('../controllers/analytics.controller');

analyticsRouter.use(protect, authorize('admin')); // All analytics = admin only
analyticsRouter.get('/summary', getSummary);
analyticsRouter.get('/monthly', getMonthly);
analyticsRouter.get('/event-types', getEventTypes);
analyticsRouter.get('/upcoming', getUpcoming);

module.exports = { calRouter, pkgRouter, analyticsRouter };

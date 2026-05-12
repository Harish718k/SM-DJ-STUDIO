const Booking = require('../models/Booking.model');
const { BlockedDate } = require('../models/Package.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Get availability for a date range
// @route   GET /api/calendar/availability?year=2024&month=6
// @access  Public
exports.getAvailability = async (req, res) => {
  try {
    const { year, month } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get booked dates
    const bookings = await Booking.find({
      eventDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['pending', 'confirmed'] }
    }).select('eventDate status');

    // Get blocked dates
    const blocked = await BlockedDate.find({
      date: { $gte: startDate, $lte: endDate }
    }).select('date reason');

    const bookedDates = bookings.map(b => ({
      date: b.eventDate.toISOString().split('T')[0],
      status: 'booked'
    }));

    const blockedDates = blocked.map(b => ({
      date: b.date.toISOString().split('T')[0],
      status: 'blocked',
      reason: b.reason
    }));

    successResponse(res, { bookedDates, blockedDates });
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Block a date
// @route   POST /api/calendar/block
// @access  Admin
exports.blockDate = async (req, res) => {
  try {
    const { date, reason } = req.body;
    const blocked = await BlockedDate.create({
      date: new Date(date),
      reason: reason || 'Unavailable',
      createdBy: req.user.id
    });
    successResponse(res, blocked, 'Date blocked', 201);
  } catch (err) {
    if (err.code === 11000) return errorResponse(res, 'Date is already blocked', 409);
    errorResponse(res, err.message);
  }
};

// @desc    Unblock a date
// @route   DELETE /api/calendar/block/:id
// @access  Admin
exports.unblockDate = async (req, res) => {
  try {
    const blocked = await BlockedDate.findByIdAndDelete(req.params.id);
    if (!blocked) return errorResponse(res, 'Blocked date not found', 404);
    successResponse(res, null, 'Date unblocked');
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Get all blocked dates
// @route   GET /api/calendar/blocked
// @access  Admin
exports.getBlockedDates = async (req, res) => {
  try {
    const blocked = await BlockedDate.find().sort({ date: 1 });
    successResponse(res, blocked);
  } catch (err) {
    errorResponse(res, err.message);
  }
};

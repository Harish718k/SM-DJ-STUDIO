const Booking = require('../models/Booking.model');
const User = require('../models/User.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// @desc    Dashboard summary stats
// @route   GET /api/analytics/summary
// @access  Admin
exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalBookings, pendingCount, confirmedCount, completedCount, monthlyRevenue, totalClients] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.aggregate([
        { $match: { status: 'completed', updatedAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      User.countDocuments({ role: 'client' })
    ]);

    const totalRevenue = await Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    successResponse(res, {
      totalBookings,
      pendingCount,
      confirmedCount,
      completedCount,
      totalClients,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Monthly bookings and revenue (chart data)
// @route   GET /api/analytics/monthly?year=2024
// @access  Admin
exports.getMonthly = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const data = await Booking.aggregate([
      {
        $match: {
          eventDate: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31)
          },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$eventDate' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalPrice' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Fill in all 12 months
    const months = Array.from({ length: 12 }, (_, i) => {
      const found = data.find(d => d._id.month === i + 1);
      return {
        month: i + 1,
        monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
        bookings: found?.bookings || 0,
        revenue: found?.revenue || 0
      };
    });

    successResponse(res, months);
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Bookings by event type (pie chart)
// @route   GET /api/analytics/event-types
// @access  Admin
exports.getEventTypes = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    successResponse(res, data.map(d => ({ eventType: d._id, count: d.count })));
  } catch (err) {
    errorResponse(res, err.message);
  }
};

// @desc    Upcoming events (next 30 days)
// @route   GET /api/analytics/upcoming
// @access  Admin
exports.getUpcoming = async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      eventDate: { $gte: now, $lte: in30Days },
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('client', 'name email phone')
      .populate('package', 'name')
      .sort({ eventDate: 1 });

    successResponse(res, bookings);
  } catch (err) {
    errorResponse(res, err.message);
  }
};

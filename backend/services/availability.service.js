/**
 * availability.service.js  — FULL REPLACEMENT
 *
 * Critical change: bookings in 'awaiting_payment' status must NOT block
 * a date — they are incomplete payments that may never be confirmed.
 * Only 'pending', 'confirmed', and 'completed' bookings block a date.
 */

const Booking = require('../models/Booking.model');

/**
 * Returns true if the given date is available for a new booking.
 * @param {string|Date} date
 */
const checkAvailability = async (date) => {
  const targetDate = new Date(date);
  targetDate.setUTCHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const existing = await Booking.findOne({
    eventDate: { $gte: targetDate, $lt: nextDay },
    // 'awaiting_payment' intentionally excluded — unpaid bookings don't hold the date
    status: { $in: ['pending', 'confirmed', 'completed'] },
  });

  return !existing;
};

module.exports = { checkAvailability };

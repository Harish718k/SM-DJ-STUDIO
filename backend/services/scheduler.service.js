const cron = require('node-cron');
const Booking = require('../models/Booking.model');
const emailService = require('./email.service');

exports.startScheduler = () => {
  console.log('⏰ Scheduler started');

  // Every day at 8:00 AM — check for upcoming events to send reminders
  cron.schedule('0 8 * * *', async () => {
    console.log('🔔 Running: Event reminder check');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2); // 48 hours from now
      const dayStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
      const dayEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1);

      const bookings = await Booking.find({
        eventDate: { $gte: dayStart, $lt: dayEnd },
        status: 'confirmed',
        reminderSent: false
      }).populate(['client', 'package']);

      for (const booking of bookings) {
        await emailService.sendEventReminder(booking);
        await Booking.findByIdAndUpdate(booking._id, { reminderSent: true });
        console.log(`✅ Reminder sent for booking ${booking._id}`);
      }
    } catch (err) {
      console.error('Scheduler error (reminders):', err.message);
    }
  });

  // Every day at midnight — auto-complete past confirmed events
  cron.schedule('0 0 * * *', async () => {
    console.log('✅ Running: Auto-complete past events');
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const bookings = await Booking.find({
        eventDate: { $lt: yesterday },
        status: 'confirmed'
      }).populate(['client', 'package']);

      for (const booking of bookings) {
        booking.status = 'completed';
        await booking.save();
        await emailService.sendReviewRequest(booking);
        console.log(`✅ Auto-completed booking ${booking._id}`);
      }
    } catch (err) {
      console.error('Scheduler error (auto-complete):', err.message);
    }
  });
};

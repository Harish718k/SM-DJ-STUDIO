const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  client: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  package: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'Package',
    required: true
  },
  eventType: {
    type:     String,
    enum:     ['wedding', 'birthday', 'corporate', 'club', 'festival', 'other'],
    required: [true, 'Event type is required']
  },
  eventDate: {
    type:     Date,
    required: [true, 'Event date is required']
  },
  startTime: {
    type:     String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type:     String,
    required: [true, 'End time is required']
  },
  venue: {
    name:    { type: String, required: true },
    address: { type: String, required: true },
    city:    { type: String, required: true }
  },
  guestCount: {
    type: Number,
    min:  1
  },
  specialRequests: {
    type:      String,
    maxlength: [1000, 'Special requests cannot exceed 1000 characters']
  },
  status: {
    type:    String,
    enum:    ['awaiting_payment', 'pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  // ── Review status ─────────────────────────────────────────────────────────
  // 'none'      = event completed but no review yet  → show "Leave a Review" button
  // 'submitted' = review saved                        → hide button, show thanks
  reviewStatus: {
    type:    String,
    enum:    ['none', 'submitted'],
    default: 'none'
  },
  // ─────────────────────────────────────────────────────────────────────────
  totalPrice: {
    type:     Number,
    required: true
  },
  depositPaid: {
    type:    Boolean,
    default: false
  },
  depositAmount: {
    type:    Number,
    default: 0
  },
  stripePaymentIntentId: {
    type:    String,
    default: null,
    index:   true
  },
  adminNotes: {
    type:      String,
    maxlength: [2000, 'Admin notes cannot exceed 2000 characters']
  },
  reminderSent: {
    type:    Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Prevent double-booking on same date
BookingSchema.index({ eventDate: 1, status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);

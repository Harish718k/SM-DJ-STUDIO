const mongoose = require('mongoose');

// ── Package Model ─────────────────────────────────────────────────────────────
const PackageSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Package name is required'],
    trim:     true
  },
  description: {
    type:     String,
    required: [true, 'Package description is required']
  },
  duration: {
    type:     Number,
    required: [true, 'Duration in hours is required'],
    min:      1
  },
  basePrice: {
    type:     Number,
    required: [true, 'Base price is required'],
    min:      0
  },
  features: [{ type: String }],
  isActive: {
    type:    Boolean,
    default: true
  },
  // Added by the Review feature — updated automatically via Review.calcAverageRating()
  averageRating: {
    type:    Number,
    default: 0,
    min:     0,
    max:     5
  },
  reviewCount: {
    type:    Number,
    default: 0
  }
}, { timestamps: true });

// ── BlockedDate Model ─────────────────────────────────────────────────────────
const BlockedDateSchema = new mongoose.Schema({
  date: {
    type:     Date,
    required: [true, 'Date is required'],
    unique:   true
  },
  reason: {
    type:    String,
    default: 'Unavailable'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User'
  }
}, { timestamps: true });

// NOTE: ReviewSchema has been moved to its own file: models/Review.model.js
// The Review model is now registered as 'Review' from that file.

module.exports = {
  Package:     mongoose.model('Package', PackageSchema),
  BlockedDate: mongoose.model('BlockedDate', BlockedDateSchema),
};

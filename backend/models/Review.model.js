/**
 * Review.model.js
 * Place at: backend/models/Review.model.js
 *
 * The existing ReviewSchema in Package.model.js is minimal.
 * This replaces it with a production-ready version that adds:
 *   - package  ref (for display on the reviews page)
 *   - eventType (denormalised for fast filtering without joins)
 *   - eventDate (denormalised for display)
 *   - isPublished flag (admin moderation gate)
 *   - Compound unique index: one review per booking, ever
 *   - Static method: calcAvgRating — updates a running average
 *     on the Package document after every save/remove
 *
 * NOTE: Remove the ReviewSchema from Package.model.js after adding this file.
 * Update the export in Package.model.js:
 *   - Remove:  const ReviewSchema = ...  and  Review: mongoose.model(...)
 *   - Keep:    Package and BlockedDate exports unchanged
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    // ── Who wrote it ────────────────────────────────────────────────────────
    client: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Client reference is required'],
      index:    true,
    },

    // ── Which booking unlocks this review ───────────────────────────────────
    booking: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Booking',
      required: [true, 'Booking reference is required'],
      unique:   true,   // one review per completed booking, enforced at DB level
    },

    // ── Which package was booked ────────────────────────────────────────────
    package: {
      type:  mongoose.Schema.Types.ObjectId,
      ref:   'Package',
      index: true,
    },

    // ── Denormalised fields (avoid extra joins on the public reviews page) ──
    eventType: {
      type: String,
      enum: ['wedding', 'birthday', 'corporate', 'club', 'festival', 'other'],
    },
    eventDate: {
      type: Date,
    },

    // ── Review content ───────────────────────────────────────────────────────
    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type:      String,
      required:  [true, 'Comment is required'],
      minlength: [10,   'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim:      true,
    },

    // ── Admin moderation ─────────────────────────────────────────────────────
    isPublished: {
      type:    Boolean,
      default: true,   // auto-publish; set false if you want manual moderation
    },
  },
  {
    timestamps: true,   // createdAt = review submission date
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
// Compound: fast lookup of all published reviews for a package, newest first
ReviewSchema.index({ package: 1, isPublished: 1, createdAt: -1 });
// Fast lookup: "has this client already reviewed this booking?"
ReviewSchema.index({ client: 1, booking: 1 });

// ── Static: recalculate average rating on the Package document ───────────────
ReviewSchema.statics.calcAverageRating = async function (packageId) {
  if (!packageId) return;

  const result = await this.aggregate([
    { $match: { package: packageId, isPublished: true } },
    {
      $group: {
        _id:           '$package',
        averageRating: { $avg: '$rating' },
        reviewCount:   { $sum: 1 },
      },
    },
  ]);

  // Dynamically require Package here to avoid circular-require at module load
  const { Package } = require('./Package.model');
  if (result.length > 0) {
    await Package.findByIdAndUpdate(packageId, {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount:   result[0].reviewCount,
    });
  } else {
    await Package.findByIdAndUpdate(packageId, {
      averageRating: 0,
      reviewCount:   0,
    });
  }
};

// Trigger recalculation after every save and remove
ReviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.package);
});
ReviewSchema.post('deleteOne', { document: true }, function () {
  this.constructor.calcAverageRating(this.package);
});

module.exports = mongoose.model('Review', ReviewSchema);

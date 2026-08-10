const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },
  cover_photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    default: null
  },
  show_in_navbar: {
    type: Boolean,
    default: false
  },
  navbar_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  allow_videos: {
    type: Boolean,
    default: true
  },

  // ─── Per-category SEO (blank = auto-generate) ──────────────────
  seo_title: { type: String, default: '', maxlength: 120 },
  seo_description: { type: String, default: '', maxlength: 400 },
  seo_keywords: { type: [String], default: [] },
  // Long-form intro copy shown on the category page — Google ko
  // real text chahiye, sirf photos se ranking nahi aati.
  intro_text: { type: String, default: '' }
}, {
  timestamps: true,
  strict: true
});

// Auto-generate slug from name before save
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this._slugManuallySet) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Index for navbar queries
categorySchema.index({ is_active: 1, navbar_order: 1 });
// slug ka index `unique: true` se already ban jaata hai — dobara declare
// karne par Mongoose duplicate-index warning deta hai.

module.exports = mongoose.model('Category', categorySchema);

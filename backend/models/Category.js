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
  }
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
categorySchema.index({ slug: 1 });

module.exports = mongoose.model('Category', categorySchema);

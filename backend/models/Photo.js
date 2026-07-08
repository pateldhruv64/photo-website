const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  public_id: {
    type: String,
    required: [true, 'Cloudinary public_id is required'],
    unique: true
  },
  width: {
    type: Number,
    required: [true, 'Image width is required']
  },
  height: {
    type: Number,
    required: [true, 'Image height is required']
  },
  aspect_ratio: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  is_featured: {
    type: Boolean,
    default: false,
    index: true
  },
  order: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false,
  strict: true
});

// Compound index for efficient querying
photoSchema.index({ category: 1, created_at: -1 });
photoSchema.index({ is_featured: 1, order: 1 });

// Auto-calculate aspect_ratio before save
photoSchema.pre('save', function(next) {
  if (this.width && this.height) {
    this.aspect_ratio = this.width / this.height;
  }
  next();
});

module.exports = mongoose.model('Photo', photoSchema);

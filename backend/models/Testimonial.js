const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  client_name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  event_type: {
    type: String,
    required: [true, 'Event type is required'],
    trim: true
  },
  review_text: {
    type: String,
    required: [true, 'Review text is required']
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 5
  },
  photo_url: {
    type: String,
    default: ''
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
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

// Index for public query
testimonialSchema.index({ is_active: 1, created_at: -1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);

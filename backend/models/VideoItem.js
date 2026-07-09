const mongoose = require('mongoose');

const videoItemSchema = new mongoose.Schema({
  youtube_url: {
    type: String,
    required: [true, 'YouTube URL is required']
  },
  youtube_id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: ''
  },
  thumbnail_url: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  order: {
    type: Number,
    default: 0
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

// Compound indexes
videoItemSchema.index({ category: 1, order: 1 });
videoItemSchema.index({ is_active: 1, category: 1 });

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function extractYoutubeId(url) {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Pre-validate hook: extract youtube_id and set thumbnail before validation runs
videoItemSchema.pre('validate', function(next) {
  if (this.isModified('youtube_url')) {
    const videoId = extractYoutubeId(this.youtube_url);
    if (!videoId) {
      return next(new Error('Invalid YouTube URL. Could not extract video ID.'));
    }
    this.youtube_id = videoId;
    this.thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  next();
});

module.exports = mongoose.model('VideoItem', videoItemSchema);

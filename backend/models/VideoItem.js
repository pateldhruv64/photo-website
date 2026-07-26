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
  platform: {
    type: String,
    enum: ['youtube', 'instagram'],
    default: 'youtube'
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

function extractVideoInfo(url) {
  if (!url) return null;

  if (url.includes('instagram.com')) {
    const match = url.match(/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return { platform: 'instagram', id: match[1], thumbnail: '/images/instagram-placeholder.png' };
    }
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.+&v=)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return { platform: 'youtube', id: match[1], thumbnail: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` };
  }

  return null;
}

const { getInstagramThumbnail } = require('../utils/instagram');

// Pre-validate hook: extract id and set thumbnail before validation runs
videoItemSchema.pre('validate', async function(next) {
  if (this.isModified('youtube_url')) {
    const info = extractVideoInfo(this.youtube_url);
    if (!info) {
      return next(new Error('Invalid video URL. Could not extract video ID.'));
    }
    this.youtube_id = info.id;
    this.platform = info.platform;
    
    if (info.platform === 'youtube') {
      if (!this.thumbnail_url || this.thumbnail_url === '/images/instagram-placeholder.png') {
        this.thumbnail_url = info.thumbnail;
      }
    } else if (info.platform === 'instagram') {
      if (!this.thumbnail_url || this.thumbnail_url === '/images/instagram-placeholder.png') {
        const autoThumb = await getInstagramThumbnail(info.id);
        this.thumbnail_url = autoThumb || '/images/instagram-placeholder.png';
      }
    }
  }
  next();
});

module.exports = mongoose.model('VideoItem', videoItemSchema);

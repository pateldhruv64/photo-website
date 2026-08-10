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
  // Cloudinary par mirror kiye gaye thumbnail ka public_id — video
  // delete karte waqt is image ko bhi hataane ke liye.
  thumbnail_public_id: {
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
      // Thumbnail async mirror hota hai — yaha khaali rakho.
      // Pehle '/images/instagram-placeholder.png' set hota tha, jo file
      // public/ me exist hi nahi karti, to browser me 404 aata tha.
      return { platform: 'instagram', id: match[1], thumbnail: '' };
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

const { mirrorInstagramThumbnail } = require('../utils/instagram');

// Purani DB entries jinme dead placeholder path pada hai
const DEAD_PLACEHOLDER = '/images/instagram-placeholder.png';

/**
 * URL badalne par video id, platform aur thumbnail set karo.
 *
 * Instagram ke liye thumbnail Cloudinary par mirror hota hai — kyunki
 * Instagram ke apne CDN URLs signed hote hain aur ghanton me expire ho
 * jaate hain (isi wajah se reels grey dikh rahi thi).
 */
videoItemSchema.pre('validate', async function (next) {
  if (!this.isModified('youtube_url')) return next();

  const info = extractVideoInfo(this.youtube_url);
  if (!info) {
    return next(new Error('Invalid video URL. Could not extract video ID.'));
  }

  this.youtube_id = info.id;
  this.platform = info.platform;

  const hasUsableThumb = this.thumbnail_url && this.thumbnail_url !== DEAD_PLACEHOLDER;

  if (info.platform === 'youtube') {
    // YouTube ke img.youtube.com URLs stable hain — mirror ki zarurat nahi
    if (!hasUsableThumb) this.thumbnail_url = info.thumbnail;
    return next();
  }

  if (info.platform === 'instagram' && !hasUsableThumb) {
    const mirrored = await mirrorInstagramThumbnail(info.id);
    if (mirrored) {
      this.thumbnail_url = mirrored.url;
      this.thumbnail_public_id = mirrored.public_id;
    } else {
      // Kuch nahi mila — khaali chhodo. Frontend ek saaf branded
      // placeholder dikhata hai, toota hua image nahi.
      this.thumbnail_url = '';
      this.thumbnail_public_id = '';
    }
  }

  next();
});

module.exports = mongoose.model('VideoItem', videoItemSchema);

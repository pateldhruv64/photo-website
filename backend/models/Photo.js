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
  // ─── Image SEO ────────────────────────────────────────────────
  // Blank rehne par utils/seo.js title + category se alt bana deta hai.
  alt_text: {
    type: String,
    default: '',
    maxlength: 250
  },
  caption: {
    type: String,
    default: '',
    maxlength: 500
  },
  location: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  strict: true
});

/* ─── Indexes ────────────────────────────────────────────────────────
   Har public photo query `{ order: 1, created_at: -1 }` par sort karti
   hai — homepage, category page, sitemap, featured, sab. Pehle iske
   liye koi index nahi tha, sirf `{ category: 1, created_at: -1 }` tha
   jo is sort ko serve nahi karta. Matlab Mongo poori collection uthaake
   memory me sort kar raha tha (SORT stage). 50 photos par pata nahi
   chalta, 500+ par chalta hai — aur 32MB par Mongo query fail kar deta
   hai.

   Neeche ke teen index un teen access patterns ko exactly match karte
   hain, is tarah ki filter fields pehle aur sort fields usi kram me
   baad me aayein (ESR rule) — tab Mongo index se hi sorted output le
   leta hai aur SORT stage lagta hi nahi.

   Field-level `index: true` hata diye gaye hain: `category` aur
   `is_featured` niche ke compound indexes ka prefix hain, to alag
   single-field index sirf write cost badhata tha, koi query tez nahi
   karta tha.                                                          */

// Homepage — bina filter ke sort
photoSchema.index({ order: 1, created_at: -1 });
// Category page / sitemap — category filter + wahi sort
photoSchema.index({ category: 1, order: 1, created_at: -1 });
// Featured marquee — is_featured filter + wahi sort
photoSchema.index({ is_featured: 1, order: 1, created_at: -1 });

// Auto-calculate aspect_ratio before save
photoSchema.pre('save', function(next) {
  if (this.width && this.height) {
    this.aspect_ratio = this.width / this.height;
  }
  next();
});

module.exports = mongoose.model('Photo', photoSchema);

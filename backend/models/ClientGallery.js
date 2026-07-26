const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientGallerySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Gallery title is required'],
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index:true
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required']
  },
  photos: [{
    public_id: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    title: { type: String, default: '' },
    order: { type: Number, default: 0 },
    original_format: { type: String, default: 'jpg' }
  }],
  client_name: {
    type: String,
    default: ''
  },
  event_date: {
    type: Date,
    default: null
  },
  expires_at: {
    type: Date,
    default: null,
    index: true
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

// Compound index
clientGallerySchema.index({ is_active: 1, slug: 1 });

// Hash password before save
clientGallerySchema.pre('save', async function(next) {
  if (this.isModified('password_hash') && !this.password_hash.startsWith('$2')) {
    // Only hash if it's a plain text password (not already hashed)
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
  }
  next();
});

// Method to verify password
clientGallerySchema.methods.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

module.exports = mongoose.model('ClientGallery', clientGallerySchema);

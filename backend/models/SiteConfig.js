const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  photographer_name: {
    type: String,
    default: 'Photographer'
  },
  hero_title: {
    type: String,
    default: 'Capturing Moments'
  },
  hero_subtitle: {
    type: String,
    default: 'Photography that tells your story'
  },
  hero_photo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Photo',
    default: null
  },
  about_text: {
    type: String,
    default: ''
  },
  contact_email: {
    type: String,
    default: ''
  },
  social_links: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  studio_logo: {
    public_id: { type: String, default: '' },
    secure_url: { type: String, default: '' }
  },
  studio_name: { type: String, default: '' },
  studio_phone: { type: String, default: '' },
  studio_website: { type: String, default: '' },
  studio_services: { type: [String], default: [] },
  studio_description: { type: String, default: '' },
  studio_whatsapp: { type: String, default: '' },
  studio_location_url: { type: String, default: '' },
  navbar_links: [{
    label: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 }
  }]
}, {
  timestamps: true,
  strict: true
});

// Single document pattern — always use findOne or upsert
siteConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne().populate('hero_photo');
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);

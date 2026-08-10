const mongoose = require('mongoose');

/**
 * SEO sub-schema.
 * Har field optional hai — jo blank chhodo, wo utils/seo.js me auto-generate ho jaata hai.
 * Matlab admin kuch bhi na bhare tab bhi site ka SEO strong rahega.
 */
const seoSchema = new mongoose.Schema({
  // ─── Core meta ───────────────────────────────────────────────
  meta_title: { type: String, default: '', maxlength: 120 },
  meta_description: { type: String, default: '', maxlength: 400 },
  keywords: { type: [String], default: [] },
  // "%s | Niks Photography" — %s page ka title hai
  title_template: { type: String, default: '' },

  // ─── Social / OG ─────────────────────────────────────────────
  og_image: {
    public_id: { type: String, default: '' },
    secure_url: { type: String, default: '' }
  },
  twitter_handle: { type: String, default: '' },

  // ─── Search console verification ─────────────────────────────
  google_site_verification: { type: String, default: '' },
  bing_site_verification: { type: String, default: '' },

  // ─── Local business / NAP (Local SEO ka core) ────────────────
  business_type: { type: String, default: 'ProfessionalService' },
  street_address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  postal_code: { type: String, default: '' },
  country: { type: String, default: 'IN' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  price_range: { type: String, default: '' },
  founding_year: { type: String, default: '' },
  // "Ahmedabad", "Gandhinagar", "Surat" — jaha jaha service dete ho
  service_areas: { type: [String], default: [] },
  // "Mo-Sa 10:00-19:00"
  opening_hours: { type: [String], default: [] },

  // ─── Indexing control ────────────────────────────────────────
  allow_indexing: { type: Boolean, default: true },
  // Admin ke blank fields auto-fill hon ya nahi
  auto_seo: { type: Boolean, default: true },

  // ─── Extras ──────────────────────────────────────────────────
  // Raw JSON-LD blocks admin khud add kar sake (advanced)
  custom_head_scripts: { type: String, default: '' }
}, { _id: false });

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
  seo: {
    type: seoSchema,
    default: () => ({})
  },
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
  // Purane documents jinme seo nahi tha unke liye safe default
  if (!config.seo) {
    config.seo = {};
  }
  return config;
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);

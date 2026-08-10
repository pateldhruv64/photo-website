/**
 * ─────────────────────────────────────────────────────────────────────
 *  AUTO-SEO ENGINE
 * ─────────────────────────────────────────────────────────────────────
 *  Admin panel me jo bhi blank chhoda jaaye, yeh file usko intelligently
 *  bhar deti hai. Isliye site ka SEO kabhi khaali nahi rehta:
 *
 *    admin ne bhara       →  wahi use hoga (manual override jeetta hai)
 *    admin ne blank chhoda →  yaha se auto-generate hoga
 *
 *  Frontend sirf /api/seo call karta hai aur poora resolved payload
 *  utha leta hai — koi guesswork frontend me nahi.
 */

// Har photography business ke liye baseline keywords.
const BASE_KEYWORDS = [
  'photographer',
  'photography',
  'professional photographer',
  'photo studio',
  'candid photography',
  'portfolio'
];

// Category name ke hisaab se intent-rich keyword expansion.
// Yeh long-tail queries hain jo actually search hoti hain.
const CATEGORY_KEYWORD_MAP = {
  wedding: ['wedding photographer', 'candid wedding photography', 'wedding photoshoot', 'destination wedding photographer', 'marriage photographer'],
  'pre-wedding': ['pre wedding shoot', 'pre wedding photographer', 'couple photoshoot', 'engagement photoshoot'],
  engagement: ['engagement photographer', 'ring ceremony photography', 'engagement photoshoot'],
  portrait: ['portrait photographer', 'portfolio shoot', 'headshot photographer', 'personal branding photoshoot'],
  maternity: ['maternity photoshoot', 'maternity photographer', 'pregnancy photoshoot'],
  baby: ['baby photoshoot', 'newborn photographer', 'kids photography'],
  newborn: ['newborn photoshoot', 'newborn photographer', 'baby photography'],
  birthday: ['birthday photographer', 'birthday party photography', 'cake smash shoot'],
  event: ['event photographer', 'corporate event photography', 'party photographer'],
  corporate: ['corporate photographer', 'business headshots', 'corporate event photography'],
  fashion: ['fashion photographer', 'model portfolio shoot', 'editorial photography'],
  product: ['product photographer', 'ecommerce product photography', 'catalogue shoot'],
  food: ['food photographer', 'restaurant menu photography'],
  haldi: ['haldi ceremony photography', 'haldi photographer'],
  mehndi: ['mehndi photography', 'mehndi ceremony photographer'],
  reception: ['reception photographer', 'wedding reception photography'],
  family: ['family photoshoot', 'family portrait photographer'],
  travel: ['travel photographer', 'destination photography'],
  cinematic: ['cinematic wedding film', 'wedding videography', 'wedding cinematography'],
  video: ['videographer', 'wedding videography', 'cinematic video shoot']
};

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

/** Text ko N characters me kaato — beech me word nahi tootna chahiye. */
const truncate = (text, max) => {
  const t = clean(text).replace(/\s+/g, ' ');
  if (!t) return '';
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,.;:\-\s]+$/, '') + '…';
};

/** Duplicate hatao, khaali hatao, lowercase compare par unique rakho. */
const uniq = (arr) => {
  const seen = new Set();
  const out = [];
  for (const item of arr || []) {
    const v = clean(item);
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
};

/**
 * Business ka display naam. studio_name > photographer_name > fallback.
 */
const resolveBrandName = (config) =>
  clean(config?.studio_name) || clean(config?.photographer_name) || 'Photography Studio';

/**
 * "Ahmedabad, Gujarat" jaisa location string — meta titles me lagta hai.
 * Local SEO ke liye sabse zaroori signal yahi hai.
 */
const resolveLocation = (seo) => {
  const parts = [clean(seo?.city), clean(seo?.state)].filter(Boolean);
  return parts.join(', ');
};

/**
 * Category names + city se keyword list banao.
 * "wedding photographer in Ahmedabad" type long-tails yaha bante hain.
 */
const buildKeywords = (config, seo, categories = []) => {
  const brand = resolveBrandName(config);
  const city = clean(seo?.city);
  const areas = uniq([city, ...(seo?.service_areas || [])]);

  const keywords = [brand, ...BASE_KEYWORDS];

  for (const cat of categories) {
    const name = clean(cat?.name);
    if (!name) continue;
    keywords.push(`${name} photography`);
    keywords.push(`${name} photographer`);

    // Slug ke andar known keyword mile to uska expansion add karo
    const slug = clean(cat?.slug).toLowerCase();
    for (const [key, expansions] of Object.entries(CATEGORY_KEYWORD_MAP)) {
      if (slug.includes(key) || name.toLowerCase().includes(key)) {
        keywords.push(...expansions);
      }
    }
  }

  // Geo-modified long tails — "<keyword> in <city>"
  if (areas.length) {
    const geoBase = uniq(keywords).slice(0, 14);
    for (const area of areas.slice(0, 4)) {
      for (const kw of geoBase) {
        if (kw === brand) continue;
        keywords.push(`${kw} in ${area}`);
      }
      keywords.push(`best photographer in ${area}`);
      keywords.push(`photography studio in ${area}`);
    }
  }

  // 60 se zyada keywords ka koi SEO fayda nahi, spam signal ban jaata hai
  return uniq(keywords).slice(0, 60);
};

/**
 * Site-wide meta title.
 * Format: "Brand — Wedding & Portrait Photographer in Ahmedabad"
 * 60 chars ke aas paas rakhte hain taki Google truncate na kare.
 */
const buildMetaTitle = (config, seo, categories = []) => {
  const brand = resolveBrandName(config);
  const location = resolveLocation(seo);

  // Top 2 navbar categories se descriptor banao
  const topCats = categories
    .filter((c) => c?.is_active !== false)
    .slice(0, 2)
    .map((c) => clean(c.name))
    .filter(Boolean);

  let descriptor = topCats.length
    ? `${topCats.join(' & ')} Photographer`
    : 'Professional Photographer';

  if (location) descriptor += ` in ${location}`;

  const title = `${brand} — ${descriptor}`;
  return title.length <= 65 ? title : truncate(title, 63);
};

/**
 * Site-wide meta description — 150–160 chars sweet spot.
 * about_text > studio_description > fully synthesised sentence.
 */
const buildMetaDescription = (config, seo, categories = []) => {
  const brand = resolveBrandName(config);
  const location = resolveLocation(seo);

  const source = clean(config?.about_text) || clean(config?.studio_description);
  if (source && source.length >= 70) return truncate(source, 158);

  const catNames = categories
    .filter((c) => c?.is_active !== false)
    .slice(0, 4)
    .map((c) => clean(c.name).toLowerCase())
    .filter(Boolean);

  const services = catNames.length
    ? catNames.join(', ')
    : 'wedding, pre-wedding, portrait and event';

  const where = location ? ` in ${location}` : '';
  const phone = clean(config?.studio_phone);

  let desc = `${brand}${where} — professional ${services} photography with candid storytelling, cinematic edits and fast delivery.`;
  if (phone) desc += ` Book your shoot today: ${phone}.`;
  else desc += ' View the portfolio and book your date today.';

  return truncate(desc, 158);
};

/**
 * Title template apply karo. Admin "%s | Brand" jaisa pattern set karta hai,
 * %s us page ka naam ban jaata hai.
 *
 * Yeh backend me hi hota hai (Next ke title.template ke bajaye) taki final
 * title ka ek hi source of truth rahe — warna brand ka naam do baar chipak
 * jaata tha: "Wedding Photography | Brand | Brand".
 */
const applyTitleTemplate = (pageName, config, seo) => {
  const brand = resolveBrandName(config);
  const template = clean(seo?.title_template) || `%s | ${brand}`;
  if (!template.includes('%s')) return truncate(pageName, 63);
  return truncate(template.replace('%s', pageName), 63);
};

/**
 * Per-category SEO resolve karo.
 */
const buildCategorySeo = (category, config, seo) => {
  const location = resolveLocation(seo);
  const name = clean(category?.name) || 'Gallery';

  // Manual seo_title ko as-is rakho — admin ne poora title likha hai.
  // Auto title par hi template lagta hai.
  const title =
    clean(category?.seo_title) ||
    applyTitleTemplate(`${name} Photography${location ? ` in ${location}` : ''}`, config, seo);

  const brand = resolveBrandName(config);

  const description =
    clean(category?.seo_description) ||
    clean(category?.intro_text) ||
    clean(category?.description) ||
    truncate(
      `Explore ${brand}'s ${name.toLowerCase()} photography portfolio${location ? ` in ${location}` : ''}. Candid, natural and cinematic ${name.toLowerCase()} photos — browse the gallery and book your session.`,
      158
    );

  const slug = clean(category?.slug).toLowerCase();
  const autoKeywords = [`${name} photography`, `${name} photographer`];
  for (const [key, expansions] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    if (slug.includes(key) || name.toLowerCase().includes(key)) {
      autoKeywords.push(...expansions);
    }
  }
  if (location) {
    autoKeywords.push(`${name} photographer in ${location}`);
    autoKeywords.push(`best ${name.toLowerCase()} photography ${location}`);
  }

  const keywords = (category?.seo_keywords || []).length
    ? uniq(category.seo_keywords)
    : uniq(autoKeywords).slice(0, 20);

  return { title, description: truncate(description, 300), keywords };
};

/**
 * Photo ka alt text. Google Images se traffic isi par depend karta hai.
 * "Candid wedding photography by Niks Photos in Ahmedabad" jaisa.
 */
const buildPhotoAlt = (photo, categoryName, config, seo) => {
  const manual = clean(photo?.alt_text);
  if (manual) return manual;

  const brand = resolveBrandName(config);
  const location = clean(photo?.location) || resolveLocation(seo);
  const title = clean(photo?.title);
  const cat = clean(categoryName);

  const parts = [];
  if (title) parts.push(title);
  if (cat) parts.push(`${cat} photography`);
  else parts.push('photography');
  parts.push(`by ${brand}`);
  if (location) parts.push(`in ${location}`);

  return truncate(parts.join(' — ').replace(' — by', ' by'), 125);
};

/**
 * Poora resolved SEO payload — /api/seo yahi return karta hai.
 */
const resolveSiteSeo = ({ config, categories = [], stats = {} }) => {
  const rawSeo = (config?.seo && typeof config.seo.toObject === 'function')
    ? config.seo.toObject()
    : (config?.seo || {});

  const autoOn = rawSeo.auto_seo !== false;
  const brand = resolveBrandName(config);
  const location = resolveLocation(rawSeo);

  const metaTitle = clean(rawSeo.meta_title) ||
    (autoOn ? buildMetaTitle(config, rawSeo, categories) : brand);

  const metaDescription = clean(rawSeo.meta_description) ||
    (autoOn ? buildMetaDescription(config, rawSeo, categories) : '');

  const keywords = (rawSeo.keywords || []).length
    ? uniq(rawSeo.keywords)
    : (autoOn ? buildKeywords(config, rawSeo, categories) : []);

  const titleTemplate = clean(rawSeo.title_template) || `%s | ${brand}`;

  // OG image priority: explicit og_image → hero photo → studio logo
  const ogImage =
    clean(rawSeo.og_image?.public_id) ||
    clean(config?.hero_photo?.public_id) ||
    clean(config?.studio_logo?.public_id) ||
    '';

  return {
    brand,
    location,
    meta_title: metaTitle,
    meta_description: metaDescription,
    title_template: titleTemplate,
    keywords,
    og_image_public_id: ogImage,
    og_image_url: clean(rawSeo.og_image?.secure_url) || clean(config?.studio_logo?.secure_url) || '',
    twitter_handle: clean(rawSeo.twitter_handle),
    google_site_verification: clean(rawSeo.google_site_verification),
    bing_site_verification: clean(rawSeo.bing_site_verification),
    allow_indexing: rawSeo.allow_indexing !== false,
    custom_head_scripts: clean(rawSeo.custom_head_scripts),

    business: {
      type: clean(rawSeo.business_type) || 'ProfessionalService',
      name: brand,
      legal_name: clean(config?.studio_name) || brand,
      founder: clean(config?.photographer_name),
      description: clean(config?.studio_description) || clean(config?.about_text) || metaDescription,
      email: clean(config?.contact_email),
      phone: clean(config?.studio_phone),
      whatsapp: clean(config?.studio_whatsapp),
      website: clean(config?.studio_website),
      map_url: clean(config?.studio_location_url),
      logo_url: clean(config?.studio_logo?.secure_url),
      street_address: clean(rawSeo.street_address),
      city: clean(rawSeo.city),
      state: clean(rawSeo.state),
      postal_code: clean(rawSeo.postal_code),
      country: clean(rawSeo.country) || 'IN',
      latitude: typeof rawSeo.latitude === 'number' ? rawSeo.latitude : null,
      longitude: typeof rawSeo.longitude === 'number' ? rawSeo.longitude : null,
      price_range: clean(rawSeo.price_range) || '₹₹',
      founding_year: clean(rawSeo.founding_year),
      service_areas: uniq(rawSeo.service_areas),
      opening_hours: (rawSeo.opening_hours || []).filter(Boolean),
      services: uniq(config?.studio_services),
      social_profiles: [
        clean(config?.social_links?.instagram),
        clean(config?.social_links?.facebook),
        clean(config?.social_links?.youtube)
      ].filter(Boolean)
    },

    stats
  };
};

module.exports = {
  resolveSiteSeo,
  buildCategorySeo,
  buildPhotoAlt,
  buildKeywords,
  buildMetaTitle,
  buildMetaDescription,
  resolveBrandName,
  resolveLocation,
  truncate,
  uniq
};

// ─── Photo ───────────────────────────────────────────────────────────
export interface Photo {
  _id: string;
  public_id: string;
  width: number;
  height: number;
  aspect_ratio: number;
  title: string;
  category: Category | string;
  is_featured: boolean;
  order: number;
  created_at: string;
  /** SEO alt text — backend blank hone par auto-generate karta hai */
  alt_text?: string;
  caption?: string;
  location?: string;
  tags?: string[];
}

// ─── Category ────────────────────────────────────────────────────────
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  cover_photo: Photo | null;
  show_in_navbar: boolean;
  navbar_order: number;
  is_active: boolean;
  photoCount?: number;
  allow_videos?: boolean;
  // Per-category SEO — blank chhodne par backend auto bharta hai
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  intro_text?: string;
}

// ─── Site Config ─────────────────────────────────────────────────────
export interface SiteConfig {
  _id: string;
  photographer_name: string;
  hero_title: string;
  hero_subtitle: string;
  hero_photo: Photo | null;
  about_text: string;
  contact_email: string;
  social_links: {
    instagram: string;
    facebook: string;
    youtube: string;
  };
  navbar_links: NavbarLink[];
  studio_logo?: {
    public_id: string;
    secure_url: string;
  } | null;
  studio_name?: string;
  studio_phone?: string;
  studio_website?: string;
  studio_services?: string[];
  studio_description?: string;
  studio_whatsapp?: string;
  studio_location_url?: string;
  seo?: SiteSeoSettings;
}

// ─── SEO Settings (admin panel se control hoti hain) ──────────────────
export interface SiteSeoSettings {
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  title_template?: string;
  og_image?: { public_id: string; secure_url: string } | null;
  twitter_handle?: string;
  google_site_verification?: string;
  bing_site_verification?: string;
  business_type?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  price_range?: string;
  founding_year?: string;
  service_areas?: string[];
  opening_hours?: string[];
  allow_indexing?: boolean;
  auto_seo?: boolean;
  custom_head_scripts?: string;
}

export interface NavbarLink {
  label: string;
  url: string;
  order: number;
}

// ─── API Responses ───────────────────────────────────────────────────
export interface PaginatedPhotos {
  photos: Photo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export interface AnalyticsData {
  overview: {
    totalPhotos: number;
    totalCategories: number;
    featuredPhotos: number;
    totalVideos: number;
    activeVideos: number;
    totalClientGalleries: number;
    activeGalleries: number;
    totalTestimonials: number;
    recentUploads: number;
  };
  photosPerCategory: Array<{
    count: number;
    name: string;
  }>;
}

// ─── Cloudinary Signature ────────────────────────────────────────────
export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  folder: string;
  cloud_name: string;
  api_key: string;
}

// ─── Video Item ──────────────────────────────────────────────────────
export interface VideoItem {
  _id: string;
  youtube_url: string;
  youtube_id: string;
  platform?: 'youtube' | 'instagram';
  title: string;
  thumbnail_url: string;
  thumbnail_public_id?: string;
  category: Category | string;
  order: number;
  is_active: boolean;
  created_at: string;
}

// ─── Testimonial ─────────────────────────────────────────────────────
export interface Testimonial {
  _id: string;
  client_name: string;
  event_type: string;
  review_text: string;
  rating: number;
  photo_url: string;
  is_active: boolean;
  created_at: string;
}

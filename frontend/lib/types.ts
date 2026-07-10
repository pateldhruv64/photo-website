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

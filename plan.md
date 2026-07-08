# PHOTOGRAPHER PORTFOLIO WEBSITE — FULL STACK

## TECH STACK
- Frontend: Next.js 14 (App Router)
- Styling: Tailwind CSS
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Media: Cloudinary (from day 1, all images via Cloudinary CDN only)
- Cache: SWR (zero duplicate API calls)
- Auth: JWT in httpOnly cookie

---

## CLOUDINARY STRATEGY (Critical — Read First)
- Upload once → store public_id + width + height + aspect_ratio in MongoDB
- NEVER store original on server
- Thumbnail URL (grid use): `/upload/w_600,q_auto:low,f_auto/{public_id}`
- Full URL (lightbox): `/upload/q_auto,f_auto/{public_id}`
- Blur placeholder: `/upload/w_10,e_blur:1000,q_1,f_auto/{public_id}`
- Upload signing: server-side only, never expose Cloudinary secret to client
- All Cloudinary uploads: direct from client to Cloudinary using signed upload preset

---

## PERFORMANCE RULES (Non-Negotiable)
1. Grid always shows thumbnail — never full size
2. Full size loads only when user clicks (lightbox)
3. Infinite scroll: 20 photos per page
4. SWR deduplication: same endpoint = 1 call even if 10 components request it
5. next/image for all images (auto WebP + lazy load)
6. blurDataURL on every image (Cloudinary blur placeholder)
7. No API call on every render — cache with SWR (staleTime: 5min)
8. MongoDB indexes: category, created_at, is_featured
9. API responses: gzip compression via Express
10. Category pages: ISR with revalidate: 3600

---

## DATABASE SCHEMAS

### Photo
public_id: String        // Cloudinary public_id
width: Number            // Original width
height: Number           // Original height
aspect_ratio: Number     // width/height (for masonry)
title: String
category: ObjectId → Category
is_featured: Boolean
order: Number
created_at: Date

### Category
name: String
slug: String (unique, auto-generated from name)
description: String
cover_photo: ObjectId → Photo
show_in_navbar: Boolean
navbar_order: Number
is_active: Boolean

### SiteConfig (single document)
photographer_name: String
hero_title: String
hero_subtitle: String
hero_photo: ObjectId → Photo
about_text: String
contact_email: String
social_links: { instagram, facebook, youtube }

### Admin
username: String
password: String (bcrypt, cost 12)

---

## API DESIGN

### Public (No Auth)
GET  /api/config                              → site config (SWR cache 1hr)
GET  /api/categories                          → all active categories (SWR cache 1hr)
GET  /api/photos?category={slug}&page=1&limit=20  → paginated photos
GET  /api/photos/featured                     → featured photos for homepage

### Admin (JWT Protected)
POST   /api/admin/login
POST   /api/admin/photos/upload               → save Cloudinary metadata to DB
PUT    /api/admin/photos/:id
DELETE /api/admin/photos/:id                  → delete from Cloudinary + DB both
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
PUT    /api/admin/config                      → update site settings
GET    /api/admin/cloudinary-signature        → signed upload params (client uploads directly to Cloudinary)

All admin routes: Express middleware checks JWT from httpOnly cookie before processing.

---

## FOLDER STRUCTURE
/
├── frontend/                    (Next.js)
│   ├── app/
│   │   ├── page.tsx             (Homepage)
│   │   ├── [category]/
│   │   │   └── page.tsx         (Category page, ISR)
│   │   ├── admin/
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── photos/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── layout.tsx
│   └── components/
│       ├── Navbar.tsx
│       ├── HeroSection.tsx
│       ├── PhotoGrid.tsx        (masonry)
│       ├── PhotoCard.tsx
│       ├── Lightbox.tsx
│       ├── CategorySection.tsx
│       ├── InfiniteScroll.tsx
│       └── admin/
│           ├── AdminLayout.tsx
│           ├── PhotoUploader.tsx
│           └── CategoryForm.tsx
│
└── backend/                     (Express)
├── models/
├── routes/
├── middleware/
├── controllers/
└── utils/cloudinary.js

---

## HOMEPAGE — EXACT BEHAVIOR

### Hero Section
- Full screen (100vh), light theme
- `position: sticky; top: 0; z-index: 0` on hero wrapper
- Content below has `position: relative; z-index: 1; background: white`
- Result: when user scrolls, content slides UP OVER the hero — hero stays behind
- Hero image from SiteConfig (admin sets it from admin panel)
- Photographer name in large Cormorant Garamond serif (dark text)
- Italic subtitle below name
- Animated scroll-down arrow

### Below Hero — Category Sections
- For each active category (from DB): section heading + photo masonry grid
- Categories appear in the order admin sets
- "View All" link per category → goes to /[category-slug] page

### Photo Grid (MASONRY — Natural Aspect Ratio)
- DO NOT use fixed height boxes or crop photos
- Photos display in their natural width:height ratio (like Pinterest / the reference screenshot)
- Landscape photos appear wider, portrait photos appear taller
- Implementation: use `react-masonry-css` with 3 columns desktop, 2 tablet, 1 mobile
- Each photo:
```jsx
  <div className="mb-3 break-inside-avoid">
    <div style={{ aspectRatio: `${photo.width}/${photo.height}` }} className="relative overflow-hidden">
      <Image
        src={thumbnailUrl(photo.public_id)}
        fill
        sizes="(max-width:768px) 100vw, 33vw"
        placeholder="blur"
        blurDataURL={blurUrl(photo.public_id)}
        alt={photo.title}
        className="object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
        onClick={() => openLightbox(photo)}
      />
    </div>
  </div>
```
- On click → Lightbox opens with `q_auto,f_auto` full URL

### Lightbox
- Full screen overlay
- Show full-resolution Cloudinary image
- prev/next navigation
- Close on backdrop click or ESC

---

## NAVBAR BEHAVIOR
- Light: white background, subtle shadow on scroll
- Left: Photographer name/logo
- Right: Dynamic links from DB (admin controls label, href, order, visibility)
- Special "My Photos" tab: if admin enables it in category → appears in navbar
- "Book Now" CTA button (links to contact/email)
- Mobile: hamburger → slide-down menu

---

## ADMIN PANEL

### Login (/admin/login)
- Username + password form
- JWT set as httpOnly cookie on success
- Redirect to /admin/dashboard

### Dashboard (/admin/dashboard)
- Stats: total photos, total categories, storage used

### Photos (/admin/photos)
- Drag & drop multi-upload
- Client uploads directly to Cloudinary using signed preset (no server bandwidth used)
- After Cloudinary upload returns → POST metadata to /api/admin/photos/upload
- Assign: category, title, featured toggle
- Grid view of all photos with delete button
- Delete: removes from Cloudinary (Cloudinary destroy API) + MongoDB

### Categories (/admin/categories)
- Create: name input → auto-generate slug (lowercase, hyphens)
- Slug editable before save
- Toggle: "Show in Navbar" checkbox
- Drag to set navbar_order
- Set cover photo (pick from uploaded photos)
- Delete category (warn if photos exist)

### Settings (/admin/settings)
- Photographer name, hero title, hero subtitle
- Pick hero image from uploaded photos
- About text
- Contact email
- Social links (Instagram, Facebook, YouTube)
- Custom navbar links (add label + URL + order)

---

## DESIGN SYSTEM — LIGHT THEME
Colors:
Background:    #FFFFFF
Surface:       #F9F9F9
Text primary:  #1A1A1A
Text muted:    #6B6B6B
Border:        #E8E8E8
Accent:        #1A1A1A
Hover surface: #F0F0F0
Typography (load via next/font, no external request):
Display/Heading: Cormorant Garamond — elegant serif
Body/UI:         DM Sans — clean sans-serif
Spacing: Tailwind defaults
Border radius: minimal (rounded-sm or none)

---

## SECURITY REQUIREMENTS
- JWT in httpOnly + Secure + SameSite=Strict cookie
- Cloudinary secret: server only, never to client
- Client gets only signed upload preset (expires in 60s)
- All admin API routes: auth middleware first
- Input validation: Zod on both frontend and backend
- Rate limiting: express-rate-limit on all /api routes (100 req/min public, 20 req/min admin)
- Sanitize MongoDB queries (no $where, use Mongoose strict mode)
- CORS: allow only frontend domain
- Helmet.js for security headers

---

## SWR USAGE (No Duplicate Calls)
```js
// In any component — SWR deduplicates automatically
const { data: categories } = useSWR('/api/categories', fetcher, { 
  revalidateOnFocus: false,
  dedupingInterval: 60000 
})

const { data, size, setSize } = useSWRInfinite(
  (page) => `/api/photos?category=${slug}&page=${page + 1}&limit=20`,
  fetcher
)
```
Never use useState + useEffect + fetch pattern — always SWR.

---

## ENV VARIABLES
Backend
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
Frontend
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_API_URL=

---

## ADDITIONAL NOTES
- Every image in Next.js: use next/image, never <img>
- next.config.js: add res.cloudinary.com to images.domains
- Admin panel: completely separate layout (no public navbar)
- All public pages: SSR or ISR — never pure CSR for SEO
- Mobile first: all grids responsive via Tailwind
- No static data anywhere — everything from DB via API
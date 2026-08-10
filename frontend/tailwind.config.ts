import type { Config } from "tailwindcss";

/**
 * ─────────────────────────────────────────────────────────────────────
 *  DESIGN TOKENS — "Coastal Blue"
 * ─────────────────────────────────────────────────────────────────────
 *  Client ki di hui brand palette:
 *
 *    #F7FBFC  page background   (sabse halka)
 *    #D6E6F2  soft surfaces / borders
 *    #B9D7EA  strong borders / highlights
 *    #769FCD  accent            (sabse gehra)
 *
 *  ⚠️ Zaroori note: in chaaron me sabse gehra #769FCD bhi page background
 *  par sirf 2.65:1 contrast deta hai — WCAG body text ke liye 4.5:1
 *  chahiye. Yaani sirf in 4 colours se text likhna possible nahi.
 *
 *  Isliye text ke liye usi hue (212°) se navy shades derive kiye hain,
 *  taki wo palette ka natural extension lagein, koi bahar ka colour nahi:
 *
 *    #142433  ink        15.2:1  headings
 *    #2E4759  ink-soft    9.3:1  sub-headings
 *    #476485  ink-muted   5.9:1  body text
 *    #3B689B  accent-deep 5.5:1  links / eyebrows (accent ka readable version)
 *
 *  Rule wahi hai: colour photos ka kaam hai, UI sirf unhe frame karta hai.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Surfaces ── */
        background: '#F7FBFC',    // client — page
        canvas: '#FFFFFF',        // cards / raised surfaces
        'surface-alt': '#D6E6F2', // client — alternating band sections
        'hover-surface': '#E8F1F8',

        /* ── Ink (text) — derived navy, same hue as accent ── */
        ink: '#142433',
        'ink-soft': '#2E4759',
        'ink-muted': '#476485',
        'ink-faint': '#769FCD',   // client — decorative/hints only, body text nahi

        /* ── Lines ── */
        line: '#D6E6F2',          // client
        'line-strong': '#B9D7EA', // client

        /* ── Accent ── */
        accent: '#769FCD',        // client — fills, borders, glows
        'accent-soft': '#B9D7EA', // client — dark backgrounds par highlight
        'accent-deep': '#3B689B', // derived — accent ka text-safe version
        'accent-tint': '#D6E6F2', // client — soft fills

        /* ── Dark sections (footer, stats, mobile menu) ── */
        obsidian: '#142433',
        'obsidian-soft': '#1E3446',

        /* ── Backwards-compatible aliases ── */
        surface: '#F7FBFC',
        'text-primary': '#142433',
        'text-muted': '#476485',
        border: '#D6E6F2',
        'accent-warm': '#769FCD',
      },
      fontFamily: {
        // Editorial serif — headings, numbers, quotes
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        // Clean sans — body, UI, labels
        body: ['var(--font-raleway)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Tight, editorial display sizes with matched line-heights
        'display-sm': ['clamp(2rem, 5vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(2.5rem, 7vw, 4rem)', { lineHeight: '1.06', letterSpacing: '-0.015em' }],
        'display-lg': ['clamp(3rem, 10vw, 6.5rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
      },
      letterSpacing: {
        label: '0.28em',
        wider: '0.18em',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        // Blue-tinted shadows — neutral grey shadows is palette par
        // dirty lagte hain, isliye navy tint (20,36,51) use kiya hai
        soft: '0 1px 2px rgba(20,36,51,0.05), 0 8px 24px -12px rgba(20,36,51,0.14)',
        lift: '0 18px 48px -14px rgba(20,36,51,0.26)',
        glow: '0 0 0 1px rgba(118,159,205,0.25), 0 20px 60px -20px rgba(118,159,205,0.45)',
      },
      transitionTimingFunction: {
        // Editorial easing — sab jagah yahi use hota hai
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'bounce-slow': 'bounceSlow 2s infinite',
        'marquee': 'marquee 30s linear infinite',
        'marquee-reverse': 'marqueeReverse 25s linear infinite',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'aperture': 'aperture 1.1s cubic-bezier(0.16,1,0.3,1) infinite',
        'draw-line': 'drawLine 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(8px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        marqueeReverse: {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        // Camera shutter khulne jaisa loader
        aperture: {
          '0%': { transform: 'rotate(0deg) scale(1)', opacity: '0.35' },
          '50%': { transform: 'rotate(180deg) scale(0.82)', opacity: '1' },
          '100%': { transform: 'rotate(360deg) scale(1)', opacity: '0.35' },
        },
        drawLine: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

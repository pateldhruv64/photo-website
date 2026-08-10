'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import AdminLayoutClient from '@/components/admin/AdminLayout';
import { fetcher, apiRequest } from '@/lib/fetcher';
import type { SiteConfig, SiteSeoSettings } from '@/lib/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/* ─── Small building blocks ──────────────────────────────────────── */

const inputCls =
  'w-full rounded-md border border-border bg-white px-3 py-2 font-body text-sm text-text-primary outline-none transition-colors focus:border-accent-warm';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-body text-[11px] uppercase tracking-wider text-text-muted">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 font-body text-xs leading-relaxed text-text-muted/80">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-white p-5 sm:p-6">
      <h2 className="font-body text-sm font-semibold text-text-primary">{title}</h2>
      {description && (
        <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">{description}</p>
      )}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** Character counter — Google ke limits ke against colour-coded. */
function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const len = value.length;
  const state = len === 0 ? 'empty' : len < min ? 'short' : len > max ? 'long' : 'good';
  const colour = {
    empty: 'text-text-muted',
    short: 'text-amber-600',
    long: 'text-red-600',
    good: 'text-green-600',
  }[state];
  const note = {
    empty: 'auto-generated',
    short: 'a bit short',
    long: 'Google will cut this off',
    good: 'good length',
  }[state];

  return (
    <span className={`font-body text-[11px] ${colour}`}>
      {len}/{max} — {note}
    </span>
  );
}

/** Comma-separated text ⇄ string[] helper. */
const toList = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean);
const fromList = (a?: string[]) => (a || []).join(', ');

/* ─── Page ───────────────────────────────────────────────────────── */

export default function SeoPage() {
  const { data: config, mutate } = useSWR<SiteConfig>('/config', fetcher, {
    revalidateOnFocus: false,
  });

  // Backend ka resolved output — admin ko exactly wahi dikhta hai jo
  // Google ko milega (blank fields ke auto values sameet).
  const { data: resolved, mutate: mutateResolved } = useSWR('/seo', fetcher, {
    revalidateOnFocus: false,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    meta_title: '',
    meta_description: '',
    keywords_text: '',
    title_template: '',
    twitter_handle: '',
    google_site_verification: '',
    bing_site_verification: '',
    business_type: 'ProfessionalService',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
    latitude: '',
    longitude: '',
    price_range: '',
    founding_year: '',
    service_areas_text: '',
    opening_hours_text: '',
    allow_indexing: true,
    auto_seo: true,
  });

  useEffect(() => {
    const s = config?.seo;
    if (!s) return;
    setForm({
      meta_title: s.meta_title || '',
      meta_description: s.meta_description || '',
      keywords_text: fromList(s.keywords),
      title_template: s.title_template || '',
      twitter_handle: s.twitter_handle || '',
      google_site_verification: s.google_site_verification || '',
      bing_site_verification: s.bing_site_verification || '',
      business_type: s.business_type || 'ProfessionalService',
      street_address: s.street_address || '',
      city: s.city || '',
      state: s.state || '',
      postal_code: s.postal_code || '',
      country: s.country || 'IN',
      latitude: s.latitude != null ? String(s.latitude) : '',
      longitude: s.longitude != null ? String(s.longitude) : '',
      price_range: s.price_range || '',
      founding_year: s.founding_year || '',
      service_areas_text: fromList(s.service_areas),
      opening_hours_text: fromList(s.opening_hours),
      allow_indexing: s.allow_indexing !== false,
      auto_seo: s.auto_seo !== false,
    });
  }, [config]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ── SEO health score ──
     Sirf wahi cheezein count karte hain jo actually ranking move karti
     hain — vanity checks nahi. */
  const audit = useMemo(() => {
    const checks = [
      {
        label: 'Business city is set',
        ok: !!form.city.trim(),
        why: 'Local searches ("photographer near me") ke liye sabse zaroori signal.',
      },
      {
        label: 'Phone number added',
        ok: !!config?.studio_phone,
        why: 'Google Business Profile aur schema dono isse match karte hain. Settings page par bharein.',
      },
      {
        label: 'Studio address filled',
        ok: !!form.street_address.trim() && !!form.postal_code.trim(),
        why: 'Poora address LocalBusiness schema ko valid banata hai.',
      },
      {
        label: 'Map coordinates set',
        ok: !!form.latitude && !!form.longitude,
        why: 'Google Maps results me exact pin place karta hai.',
      },
      {
        label: 'Service areas listed',
        ok: toList(form.service_areas_text).length > 0,
        why: 'Aas-paas ke shehron ki searches me bhi site dikhti hai.',
      },
      {
        label: 'Opening hours listed',
        ok: toList(form.opening_hours_text).length > 0,
        why: 'Search result me "Open now" badge aata hai.',
      },
      {
        label: 'About text written',
        ok: (config?.about_text || '').length > 80,
        why: 'Homepage par asli padhne-layak text — Settings page par bharein.',
      },
      {
        label: 'Hero photo selected',
        ok: !!config?.hero_photo,
        why: 'WhatsApp/Facebook par link share hone par preview image yahi banti hai.',
      },
      {
        label: 'Social profiles linked',
        ok: (resolved?.business?.social_profiles || []).length > 0,
        why: 'Google ko brand verify karne me madad karta hai.',
      },
      {
        label: 'Google verification code',
        ok: !!form.google_site_verification.trim(),
        why: 'Search Console connect karne ke liye — rankings track kar payenge.',
      },
      {
        label: 'Search engines allowed',
        ok: form.allow_indexing,
        why: 'Yeh band ho to site bilkul index nahi hogi.',
      },
      {
        label: 'Client reviews added',
        ok: (resolved?.stats?.review_count || 0) >= 3,
        why: 'Search results me star rating dikhane ke liye kam se kam 3 reviews chahiye.',
      },
    ];

    const passed = checks.filter((c) => c.ok).length;
    return { checks, passed, total: checks.length, score: Math.round((passed / checks.length) * 100) };
  }, [form, config, resolved]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');

    const seo: SiteSeoSettings = {
      meta_title: form.meta_title.trim(),
      meta_description: form.meta_description.trim(),
      keywords: toList(form.keywords_text),
      title_template: form.title_template.trim(),
      twitter_handle: form.twitter_handle.trim(),
      google_site_verification: form.google_site_verification.trim(),
      bing_site_verification: form.bing_site_verification.trim(),
      business_type: form.business_type,
      street_address: form.street_address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postal_code: form.postal_code.trim(),
      country: form.country.trim() || 'IN',
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      price_range: form.price_range.trim(),
      founding_year: form.founding_year.trim(),
      service_areas: toList(form.service_areas_text),
      opening_hours: toList(form.opening_hours_text),
      allow_indexing: form.allow_indexing,
      auto_seo: form.auto_seo,
    };

    // Latitude/longitude me galat text aane par backend zod reject karega —
    // yaha pehle hi rok lete hain taki error message clear rahe.
    if ((form.latitude && Number.isNaN(Number(form.latitude))) ||
        (form.longitude && Number.isNaN(Number(form.longitude)))) {
      setError('Latitude and longitude must be numbers, e.g. 23.0225 and 72.5714');
      setSaving(false);
      return;
    }

    try {
      await apiRequest('/admin/config', 'PUT', { seo } as unknown as Record<string, unknown>);
      await Promise.all([mutate(), mutateResolved()]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  // Preview me wahi dikhao jo actually live jaayega
  const previewTitle = form.meta_title.trim() || resolved?.meta_title || 'Your site title';
  const previewDesc =
    form.meta_description.trim() || resolved?.meta_description || 'Your site description';
  const displayUrl = SITE_URL.replace(/^https?:\/\//, '');

  return (
    <AdminLayoutClient>
      <div className="max-w-6xl">
        {/* ── Header ── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-light text-text-primary">SEO & Google</h1>
            <p className="mt-1 font-body text-sm text-text-muted">
              Jo field blank chhodenge, wo automatically bhar jaayegi. Kuch bhi na bharein
              tab bhi site ka SEO chalega — yaha bharne se aur strong hoga.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="font-body text-sm text-green-600">✓ Saved &amp; live</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-text-primary px-5 py-2.5 font-body text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save SEO settings'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ══ Left: the form ══ */}
          <div className="space-y-6 lg:col-span-2">
            <Section
              title="Search appearance"
              description="Yeh text Google ke search results me dikhta hai."
            >
              <Field
                label="Meta title"
                hint="Blank chhodenge to studio ka naam + services + city se auto ban jaayega."
              >
                <input
                  className={inputCls}
                  value={form.meta_title}
                  onChange={(e) => set('meta_title', e.target.value)}
                  placeholder={resolved?.meta_title || 'Auto-generated'}
                  maxLength={120}
                />
                <div className="mt-1.5">
                  <Counter value={form.meta_title} min={30} max={60} />
                </div>
              </Field>

              <Field label="Meta description" hint="150–160 characters best hai.">
                <textarea
                  className={`${inputCls} min-h-[88px] resize-y`}
                  value={form.meta_description}
                  onChange={(e) => set('meta_description', e.target.value)}
                  placeholder={resolved?.meta_description || 'Auto-generated'}
                  maxLength={400}
                />
                <div className="mt-1.5">
                  <Counter value={form.meta_description} min={120} max={160} />
                </div>
              </Field>

              <Field
                label="Keywords"
                hint="Comma se alag karein. Blank chhodenge to categories + city se apne aap ban jaayenge."
              >
                <textarea
                  className={`${inputCls} min-h-[64px] resize-y`}
                  value={form.keywords_text}
                  onChange={(e) => set('keywords_text', e.target.value)}
                  placeholder="wedding photographer, pre wedding shoot, candid photography"
                />
                <p className="mt-1.5 font-body text-[11px] text-text-muted">
                  Abhi live: <strong>{resolved?.keywords?.length || 0}</strong> keywords
                </p>
              </Field>

              <Field
                label="Inner page title format"
                hint="%s us page ka naam ban jaata hai. Blank = “Page | Studio Name”."
              >
                <input
                  className={inputCls}
                  value={form.title_template}
                  onChange={(e) => set('title_template', e.target.value)}
                  placeholder={resolved?.title_template || '%s | Studio Name'}
                />
              </Field>
            </Section>

            <Section
              title="Local business (Google Maps)"
              description="“photographer near me” type searches me aane ke liye — sabse zyada asar isi section ka hota hai."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="City *">
                  <input
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    placeholder="Ahmedabad"
                  />
                </Field>
                <Field label="State">
                  <input
                    className={inputCls}
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    placeholder="Gujarat"
                  />
                </Field>
              </div>

              <Field label="Street address">
                <input
                  className={inputCls}
                  value={form.street_address}
                  onChange={(e) => set('street_address', e.target.value)}
                  placeholder="12, Shivalik Plaza, Satellite Road"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="PIN code">
                  <input
                    className={inputCls}
                    value={form.postal_code}
                    onChange={(e) => set('postal_code', e.target.value)}
                    placeholder="380015"
                  />
                </Field>
                <Field label="Country code">
                  <input
                    className={inputCls}
                    value={form.country}
                    onChange={(e) => set('country', e.target.value)}
                    placeholder="IN"
                  />
                </Field>
                <Field label="Price range">
                  <input
                    className={inputCls}
                    value={form.price_range}
                    onChange={(e) => set('price_range', e.target.value)}
                    placeholder="₹₹"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Latitude" hint="Google Maps par studio par right-click → coordinates copy.">
                  <input
                    className={inputCls}
                    value={form.latitude}
                    onChange={(e) => set('latitude', e.target.value)}
                    placeholder="23.0225"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    className={inputCls}
                    value={form.longitude}
                    onChange={(e) => set('longitude', e.target.value)}
                    placeholder="72.5714"
                    inputMode="decimal"
                  />
                </Field>
              </div>

              <Field
                label="Service areas"
                hint="Jin shehron me shoot karte hain — comma se alag. Har shehar ke keywords apne aap ban jaate hain."
              >
                <input
                  className={inputCls}
                  value={form.service_areas_text}
                  onChange={(e) => set('service_areas_text', e.target.value)}
                  placeholder="Ahmedabad, Gandhinagar, Surat, Udaipur"
                />
              </Field>

              <Field
                label="Opening hours"
                hint="Format: Mo-Sa 10:00-19:00 — comma se multiple lines."
              >
                <input
                  className={inputCls}
                  value={form.opening_hours_text}
                  onChange={(e) => set('opening_hours_text', e.target.value)}
                  placeholder="Mo-Sa 10:00-19:00, Su 11:00-16:00"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Business type">
                  <select
                    className={inputCls}
                    value={form.business_type}
                    onChange={(e) => set('business_type', e.target.value)}
                  >
                    <option value="ProfessionalService">Professional Service</option>
                    <option value="LocalBusiness">Local Business</option>
                    <option value="PhotographAction">Photography Service</option>
                    <option value="EntertainmentBusiness">Entertainment Business</option>
                  </select>
                </Field>
                <Field label="Studio started in">
                  <input
                    className={inputCls}
                    value={form.founding_year}
                    onChange={(e) => set('founding_year', e.target.value)}
                    placeholder="2018"
                  />
                </Field>
              </div>
            </Section>

            <Section
              title="Search Console & social"
              description="Verification codes yaha daalein — inhe manually HTML me daalne ki zarurat nahi."
            >
              <Field
                label="Google verification code"
                hint="Search Console → HTML tag method → sirf content=&quot;…&quot; wali value paste karein."
              >
                <input
                  className={inputCls}
                  value={form.google_site_verification}
                  onChange={(e) => set('google_site_verification', e.target.value)}
                  placeholder="AbCdEf123..."
                />
              </Field>
              <Field label="Bing verification code">
                <input
                  className={inputCls}
                  value={form.bing_site_verification}
                  onChange={(e) => set('bing_site_verification', e.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Twitter / X handle">
                <input
                  className={inputCls}
                  value={form.twitter_handle}
                  onChange={(e) => set('twitter_handle', e.target.value)}
                  placeholder="@studioname"
                />
              </Field>
            </Section>

            <Section title="Indexing control">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 transition-colors hover:bg-hover-surface/40">
                <input
                  type="checkbox"
                  checked={form.allow_indexing}
                  onChange={(e) => set('allow_indexing', e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#769FCD]"
                />
                <span>
                  <span className="block font-body text-sm text-text-primary">
                    Allow search engines to index this site
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-text-muted">
                    Isse band karne par poori site Google se hat jaayegi. Sirf tab band karein
                    jab site abhi ready na ho.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 transition-colors hover:bg-hover-surface/40">
                <input
                  type="checkbox"
                  checked={form.auto_seo}
                  onChange={(e) => set('auto_seo', e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#769FCD]"
                />
                <span>
                  <span className="block font-body text-sm text-text-primary">
                    Auto-fill blank SEO fields
                  </span>
                  <span className="mt-0.5 block font-body text-xs text-text-muted">
                    Recommended. Khaali fields categories, city aur studio details se
                    apne aap bhar jaate hain.
                  </span>
                </span>
              </label>
            </Section>
          </div>

          {/* ══ Right: preview + score ══ */}
          <div className="space-y-6">
            {/* Google result preview */}
            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="font-body text-sm font-semibold text-text-primary">
                Google preview
              </h2>
              <p className="mt-1 font-body text-xs text-text-muted">
                Search results me aisa dikhega
              </p>

              <div className="mt-4 rounded-md border border-border bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] ring-1 ring-border">
                    📷
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-body text-[12px] leading-tight text-[#202124]">
                      {resolved?.brand || 'Your Studio'}
                    </p>
                    <p className="truncate font-body text-[11px] leading-tight text-[#4d5156]">
                      {displayUrl}
                    </p>
                  </div>
                </div>

                <p className="mt-2 line-clamp-2 font-body text-[17px] leading-snug text-[#1a0dab]">
                  {previewTitle}
                </p>
                <p className="mt-1 line-clamp-3 font-body text-[13px] leading-relaxed text-[#4d5156]">
                  {previewDesc}
                </p>

                {resolved?.stats?.rating_value && resolved.stats.review_count > 0 && (
                  <p className="mt-1.5 font-body text-[12px] text-[#4d5156]">
                    <span className="text-[#f5a623]">
                      {'★'.repeat(Math.round(resolved.stats.rating_value))}
                    </span>{' '}
                    {resolved.stats.rating_value} · {resolved.stats.review_count} reviews
                  </p>
                )}
              </div>
            </div>

            {/* Health score */}
            <div className="rounded-lg border border-border bg-white p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-body text-sm font-semibold text-text-primary">SEO score</h2>
                <span
                  className={`font-display text-3xl font-light ${
                    audit.score >= 80
                      ? 'text-green-600'
                      : audit.score >= 50
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {audit.score}
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-hover-surface">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${
                    audit.score >= 80
                      ? 'bg-green-500'
                      : audit.score >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${audit.score}%` }}
                />
              </div>

              <p className="mt-2 font-body text-xs text-text-muted">
                {audit.passed} of {audit.total} checks passed
              </p>

              <ul className="mt-4 space-y-2.5">
                {audit.checks.map((c) => (
                  <li key={c.label} className="flex gap-2.5">
                    <span
                      className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${
                        c.ok ? 'bg-green-500' : 'bg-border text-text-muted'
                      }`}
                      aria-hidden
                    >
                      {c.ok ? '✓' : '!'}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-body text-xs ${
                          c.ok ? 'text-text-muted line-through' : 'text-text-primary'
                        }`}
                      >
                        {c.label}
                      </span>
                      {!c.ok && (
                        <span className="mt-0.5 block font-body text-[11px] leading-relaxed text-text-muted">
                          {c.why}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Live files */}
            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="font-body text-sm font-semibold text-text-primary">
                Auto-generated files
              </h2>
              <p className="mt-1 font-body text-xs leading-relaxed text-text-muted">
                Yeh sab apne aap update hote hain — Search Console me sirf sitemap submit karna hai.
              </p>
              <ul className="mt-3 space-y-2 font-body text-xs">
                {[
                  { label: 'Sitemap', href: '/sitemap.xml' },
                  { label: 'Image sitemap', href: '/image-sitemap.xml' },
                  { label: 'Robots.txt', href: '/robots.txt' },
                ].map((f) => (
                  <li key={f.href}>
                    <a
                      href={`${SITE_URL}${f.href}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-text-muted transition-colors hover:border-accent-warm hover:text-text-primary"
                    >
                      <span>{f.label}</span>
                      <span className="text-accent-warm">{f.href} ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayoutClient>
  );
}

import Link from 'next/link';
import type { SeoPayload } from '@/lib/seo';

interface Props {
  seo: SeoPayload;
}

/**
 * Server component — poora content HTML me hi render hota hai (koi JS nahi).
 *
 * Photography sites ka sabse bada SEO problem yahi hai: page bhar ke
 * images hoti hain aur Google ke liye padhne layak text zero. Yeh section
 * wo gap bharta hai — services, service areas aur trust signals,
 * sab crawlable text me, aur dikhne me bhi ek proper "About" block.
 */
export default function SeoContentSection({ seo }: Props) {
  const b = seo.business;
  const where = seo.location ? ` in ${seo.location}` : '';
  const categories = seo.categories.slice(0, 8);
  const services = b.services.length
    ? b.services
    : categories.map((c) => `${c.name} Photography`);

  const stats = [
    seo.stats.photo_count > 0 && { value: `${seo.stats.photo_count}+`, label: 'Photos delivered' },
    seo.stats.category_count > 0 && { value: `${seo.stats.category_count}`, label: 'Portfolio collections' },
    seo.stats.review_count > 0 && { value: `${seo.stats.review_count}+`, label: 'Happy clients' },
    b.founding_year && { value: `Since ${b.founding_year}`, label: 'Capturing stories' },
  ].filter(Boolean) as Array<{ value: string; label: string }>;

  return (
    <section
      id="about-section"
      aria-labelledby="about-heading"
      className="relative py-16 md:py-24 bg-surface-alt border-t border-line/60"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ── Left: the actual prose Google reads ── */}
          <div className="lg:col-span-7">
            <p className="eyebrow">About the studio</p>

            <h2
              id="about-heading"
              className="font-display text-3xl sm:text-4xl md:text-5xl font-light leading-[1.12] text-ink"
            >
              {b.founder || seo.brand}
              <span className="block italic text-ink-soft">
                Professional photographer{where}
              </span>
            </h2>

            <div className="mt-6 space-y-4 font-body text-[15px] leading-relaxed text-ink-muted">
              <p>
                {b.description ||
                  `${seo.brand} is a professional photography studio${where} specialising in candid,
                   emotion-first storytelling. Every frame is shot with intent and finished with a
                   cinematic, true-to-skin edit — so your photos still feel like you, years later.`}
              </p>

              {services.length > 0 && (
                <p>
                  We photograph{' '}
                  {services.slice(0, 6).map((s, i, arr) => (
                    <span key={s}>
                      <strong className="font-medium text-ink">{s.toLowerCase()}</strong>
                      {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : ''}
                    </span>
                  ))}
                  {where} and across India — with full-day coverage, a private online gallery and
                  high-resolution downloads included.
                </p>
              )}

              {b.service_areas.length > 0 && (
                <p>
                  <span className="text-ink">Areas we serve:</span>{' '}
                  {b.service_areas.join(', ')} — and destination shoots on request.
                </p>
              )}
            </div>

            {/* Internal links — crawler ko category pages tak le jaate hain
                aur link equity distribute karte hain. */}
            {categories.length > 0 && (
              <nav aria-label="Photography collections" className="mt-8">
                <h3 className="font-body text-[11px] font-medium uppercase tracking-[0.28em] text-ink-muted">
                  Explore our work
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <Link
                        href={`/${cat.slug}`}
                        className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-4 py-2 font-body text-[13px] text-ink-soft transition-colors duration-300 hover:border-ink hover:text-ink"
                      >
                        {cat.name} Photography
                        <span
                          aria-hidden
                          className="translate-x-0 text-accent transition-transform duration-300 group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>

          {/* ── Right: trust signals + NAP block ── */}
          <div className="lg:col-span-5">
            {stats.length > 0 && (
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
                {stats.map((s) => (
                  <div key={s.label} className="bg-canvas px-5 py-6">
                    <dt className="font-body text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      {s.label}
                    </dt>
                    <dd className="mt-1.5 font-display text-2xl font-light text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* NAP (Name / Address / Phone) — Local SEO ka sabse strong
                on-page signal. Google isko schema ke saath cross-check karta hai. */}
            {(b.phone || b.email || b.city) && (
              <address className="mt-6 not-italic rounded-2xl border border-line bg-canvas p-6">
                <h3 className="font-body text-[11px] font-medium uppercase tracking-[0.28em] text-ink-muted">
                  Studio details
                </h3>

                <p className="mt-4 font-display text-xl font-light text-ink">{b.name}</p>

                {(b.street_address || b.city) && (
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-ink-muted">
                    {[b.street_address, b.city, b.state, b.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}

                <div className="mt-4 space-y-2 font-body text-sm">
                  {b.phone && (
                    <p>
                      <a
                        href={`tel:${b.phone.replace(/\s/g, '')}`}
                        className="text-ink-soft transition-colors hover:text-accent"
                      >
                        {b.phone}
                      </a>
                    </p>
                  )}
                  {b.email && (
                    <p>
                      <a
                        href={`mailto:${b.email}`}
                        className="text-ink-soft transition-colors hover:text-accent"
                      >
                        {b.email}
                      </a>
                    </p>
                  )}
                  {b.map_url && (
                    <p>
                      <a
                        href={b.map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline-offset-4 hover:underline"
                      >
                        View studio on Google Maps
                      </a>
                    </p>
                  )}
                </div>

                {b.opening_hours.length > 0 && (
                  <div className="mt-5 border-t border-line pt-4">
                    <h4 className="font-body text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                      Open hours
                    </h4>
                    <ul className="mt-2 space-y-1 font-body text-sm text-ink-soft">
                      {b.opening_hours.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </address>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

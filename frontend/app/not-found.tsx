import Link from 'next/link';
import type { Metadata } from 'next';
import { getSeo } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: true },
};

/**
 * 404 page. Soft-404 se bachne ke liye noindex hai, par follow: true —
 * taki crawler yaha se wapas asli pages tak pahunch sake.
 */
export default async function NotFound() {
  const seo = await getSeo();
  const categories = seo.categories.slice(0, 6);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-24 text-center">
      <p className="eyebrow justify-center">Error 404</p>

      <h1 className="max-w-2xl font-display text-4xl font-light leading-tight text-ink sm:text-5xl md:text-6xl">
        This frame doesn&rsquo;t exist
        <span className="block italic text-ink-soft">but the gallery does</span>
      </h1>

      <p className="mt-5 max-w-md font-body text-[15px] leading-relaxed text-ink-muted">
        The page you were looking for has moved or was never here. Head back to the portfolio —
        there is plenty worth seeing.
      </p>

      <Link
        href="/"
        className="mt-9 inline-flex items-center gap-2.5 rounded-full bg-ink px-7 py-3.5 font-body text-[13px] uppercase tracking-[0.18em] text-canvas transition-transform duration-300 hover:-translate-y-0.5"
      >
        Back to portfolio
        <span aria-hidden>→</span>
      </Link>

      {categories.length > 0 && (
        <nav aria-label="Photography collections" className="mt-12 max-w-2xl">
          <p className="font-body text-[11px] uppercase tracking-[0.28em] text-ink-muted">
            Or jump into a collection
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/${cat.slug}`}
                  className="inline-block rounded-full border border-line bg-canvas px-4 py-2 font-body text-[13px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </main>
  );
}

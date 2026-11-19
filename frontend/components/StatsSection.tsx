'use client';

import { useEffect, useRef, useState } from 'react';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

/* Numbers yahan hardcoded hain — sirf wahi rakhna jo sach me sahi ho.
   Agar admin panel se badalne ho to inhe config se lena chahiye. */
const STATS: Stat[] = [
  { value: 5, suffix: '+', label: 'Years Experience' },
  { value: 500, suffix: '+', label: 'Photos Delivered' },
  { value: 150, suffix: '+', label: 'Happy Clients' },
  { value: 10, suffix: '+', label: 'Cities Covered' },
];

function CountUp({
  target,
  suffix,
  start,
}: {
  target: number;
  suffix: string;
  start: boolean;
}) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    const startTime = performance.now();
    const duration = 2000;
    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else setCount(target);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [start, target]);

  return (
    <>
      {/* Screen reader ko sirf final value mile, 0 se 500 tak ginti nahi */}
      <span className="sr-only">
        {target}
        {suffix}
      </span>
      {/* lining-nums: is font me default numerals "oldstyle" hain, jisse 1 aisa
          dikhta tha jaise capital I aur 0 jaise chhota o. */}
      <span aria-hidden className="lining-nums tabular-nums">
        {count}
        <span className="text-accent-soft/80">{suffix}</span>
      </span>
    </>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect(); // ek hi baar chalana hai
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="my-6 bg-ink py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hairlines yahan decoration nahi, grouping dikhati hain:
            mobile par 2x2, desktop par 4 columns ek row me. */}
        <dl className="grid grid-cols-2 border-y border-white/15 md:grid-cols-4">
          {STATS.map((stat, idx) => (
            <div
              key={stat.label}
              style={{ transitionDelay: `${idx * 0.1}s` }}
              className={`reveal border-white/15 px-5 py-6 md:px-8 md:py-8 ${
                idx % 2 === 1 ? 'border-l' : ''
              } ${idx < 2 ? 'border-b' : ''} md:border-b-0 ${
                idx > 0 ? 'md:border-l' : 'md:border-l-0'
              }`}
            >
              {/* dl semantic: <dt> label, <dd> value — isliye label DOM me pehle,
                  visually neeche (flex-col-reverse) */}
              <div className="flex flex-col-reverse">
                <dt className="mt-3 font-body text-sm text-white/60 md:text-base">
                  {stat.label}
                </dt>
                <dd className="font-display text-5xl font-light leading-none tracking-tight text-white sm:text-6xl md:text-7xl">
                  <CountUp
                    target={stat.value}
                    suffix={stat.suffix}
                    start={started}
                  />
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

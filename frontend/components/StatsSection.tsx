'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import BorderBeam from '@/components/ui/BorderBeam';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: JSX.Element;
}

const STATS: Stat[] = [
  {
    value: 5,
    suffix: '+',
    label: 'Years Experience',
    icon: (
      <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: 500,
    suffix: '+',
    label: 'Photos Delivered',
    icon: (
      <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: 150,
    suffix: '+',
    label: 'Happy Clients',
    icon: (
      <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    value: 10,
    suffix: '+',
    label: 'Cities Covered',
    icon: (
      <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function CountUp({ target, suffix, start }: { target: number; suffix: string; start: boolean }) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const duration = 2500;
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // More dramatic easing: slow start, fast middle, slow end
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
      else setCount(target);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [start, target]);

  // Split digits for individual styling
  const digits = count.toString().split('');

  return (
    <span className="inline-flex items-baseline">
      {digits.map((digit, i) => (
        <span
          key={i}
          className="inline-block transition-all duration-150"
          style={{
            transform: start ? 'translateY(0)' : 'translateY(20px)',
            opacity: start ? 1 : 0,
            transitionDelay: `${i * 50}ms`,
          }}
        >
          {digit}
        </span>
      ))}
      <span className="text-amber-300/70">{suffix}</span>
    </span>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
    );
    const current = ref.current;
    if (current) observer.observe(current);
    return () => { if (current) observer.unobserve(current); };
  }, [started]);

  return (
    <section ref={ref} className="py-14 md:py-20 bg-[#1E1410] relative overflow-hidden my-6">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative rounded-3xl bg-white/5 border border-white/10 p-8 md:p-12 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Moving Inspira Border Beam */}
          <BorderBeam size={220} duration={8} colorFrom="#B5784A" colorTo="#F7F2EB" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300 shadow-md">
                  {stat.icon}
                </div>
                <p className="font-display text-4xl sm:text-5xl md:text-6xl font-light text-white tracking-tight mb-2">
                  <CountUp target={stat.value} suffix={stat.suffix} start={started} />
                </p>
                <p className="font-body text-[10px] md:text-xs tracking-[0.25em] uppercase text-white/60 font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

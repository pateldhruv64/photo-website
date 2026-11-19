'use client';

import { useState } from 'react';
import { FAQ_DATA } from '@/lib/faq';

/**
 * FAQ accordion — ab framer-motion ke bina.
 *
 * Height animate karna hamesha tricky hota hai kyunki `height: auto`
 * animate nahi ho sakta. framer-motion isko JS se measure karke solve
 * karta tha. Yaha CSS grid ka trick use kiya hai:
 *
 *     grid-template-rows: 0fr  ->  1fr
 *
 * Yeh pure CSS me smoothly animate hota hai, content ki height chahe
 * kuch bhi ho — aur measurement ke liye ek line JS bhi nahi chahiye.
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section
      className="relative overflow-hidden bg-surface py-8 md:py-10"
      id="faq-section"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <p className="eyebrow justify-center">Common Questions</p>
          <h2 className="font-display text-3xl font-light text-ink sm:text-4xl md:text-5xl">
            Frequently asked{' '}
            <span className="italic text-ink-soft">questions</span>
          </h2>
          <p className="mt-3 max-w-md font-body text-sm leading-relaxed text-ink-muted">
            Everything you need to know before booking. Can&apos;t find your
            answer? Reach out on WhatsApp.
          </p>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            const panelId = `faq-panel-${idx}`;
            const buttonId = `faq-button-${idx}`;

            return (
              <div
                key={item.question}
                className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
                  isOpen
                    ? 'border-accent/40 bg-canvas shadow-soft'
                    : 'border-line bg-canvas/60 hover:border-line-strong'
                }`}
                style={{ transitionDelay: `${idx * 0.04}s` }}
              >
                <h3>
                  <button
                    id={buttonId}
                    onClick={() => toggle(idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                  >
                    <span
                      className={`font-display text-base font-medium transition-colors sm:text-lg ${
                        isOpen
                          ? 'text-ink'
                          : 'text-ink-soft group-hover:text-ink'
                      }`}
                    >
                      {item.question}
                    </span>

                    <span
                      aria-hidden
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ease-editorial ${
                        isOpen
                          ? 'rotate-45 bg-ink text-canvas'
                          : 'bg-surface-alt text-ink-muted group-hover:bg-line-strong'
                      }`}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M7 1v12M1 7h12"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </button>
                </h3>

                {/* grid 0fr -> 1fr = smooth auto-height, zero JS */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="grid transition-[grid-template-rows] duration-400 ease-editorial"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 sm:px-6">
                      <div className="mb-4 h-px bg-line" />
                      <p className="font-body text-sm leading-relaxed text-ink-muted sm:text-[15px]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

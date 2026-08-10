'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { FAQ_DATA } from '@/lib/faq';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-8 md:py-14 bg-surface relative overflow-hidden" id="faq-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <p className="eyebrow justify-center mb-2">
            Common Questions
          </p>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-light text-text-primary">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 font-body text-sm md:text-base text-text-muted max-w-md">
            Everything you need to know before booking. Can&apos;t find your answer? Reach out via WhatsApp!
          </p>
          <div className="divider-line mx-auto mt-6 max-w-[80px]" />
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {FAQ_DATA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-white shadow-lg border-[#769FCD]/30'
                    : 'bg-white/60 backdrop-blur-sm border-border hover:border-[#769FCD]/20 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className={`font-display text-base md:text-lg font-medium pr-4 transition-colors ${
                    isOpen ? 'text-[#142433]' : 'text-[#142433]/80 group-hover:text-[#142433]'
                  }`}>
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isOpen ? 'bg-[#142433] text-white' : 'bg-[#D6E6F2] text-[#476485]'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-5 pt-0">
                        <div className="h-px bg-border/50 mb-4" />
                        <p className="font-body text-sm md:text-base text-text-muted leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ content — ek hi jagah, do jagah use hoti hai:
 *   1. FAQSection component (UI accordion)
 *   2. Homepage ka FAQPage JSON-LD (Google rich result)
 *
 * Dono ka source same rakhna zaroori hai — warna schema aur page ka
 * text mismatch ho jaata hai aur Google structured data reject kar deta hai.
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_DATA: FAQItem[] = [
  {
    question: 'How far in advance should I book?',
    answer:
      'We recommend booking at least 2–4 weeks in advance for portrait sessions and 2–3 months ahead for weddings and large events. Popular dates (especially weekends and festive seasons) fill up fast, so early booking ensures you get your preferred date.',
  },
  {
    question: 'Do you travel to other cities for shoots?',
    answer:
      "Absolutely! We love destination shoots. Whether it's a pre-wedding in Udaipur, a wedding in Jaipur, or a corporate event in Mumbai — we're ready to travel. Travel charges may apply based on distance and logistics.",
  },
  {
    question: 'How long until I receive my edited photos?',
    answer:
      "Typically, you'll receive your fully edited gallery within 7–14 working days after the shoot. For weddings and large events, it may take up to 3–4 weeks. Rush delivery is available on request.",
  },
  {
    question: 'Can I get both photos and videos?',
    answer:
      'Yes! We offer combined photography and videography packages. Having both ensures your memories are captured from every angle — both the still moments and the moving ones.',
  },
  {
    question: 'Do you provide raw/unedited files?',
    answer:
      'We deliver professionally edited photos that represent our best work and brand quality. Raw files are generally not included, but can be discussed as an add-on if needed.',
  },
  {
    question: 'What happens if it rains on the shoot day?',
    answer:
      "Don't worry! We always have a backup plan. We can reschedule to another date at no extra cost, or we can use covered/indoor locations. Rain photography can also create some stunning, dramatic shots!",
  },
  {
    question: 'What should I wear for a photoshoot?',
    answer:
      "We'll guide you on outfit choices during the consultation. Generally, solid colors, pastels, and coordinated outfits work best. Avoid busy patterns and neon colors. We can also create a mood board together!",
  },
  {
    question: 'Can I customize a package to fit my needs?',
    answer:
      "Of course! Every event is unique. We're happy to tailor a custom package based on your specific requirements — number of hours, locations, deliverables, and budget. Just reach out via WhatsApp!",
  },
];

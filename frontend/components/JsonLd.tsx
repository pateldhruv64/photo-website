import { jsonLd } from '@/lib/seo';

interface Props {
  data: unknown;
  id?: string;
}

/**
 * Server component — JSON-LD ko HTML me directly render karta hai
 * (client hydration ke bina), taki crawler ko pehli hi request me mil jaaye.
 */
export default function JsonLd({ data, id }: Props) {
  return (
    <script
      type="application/ld+json"
      id={id}
      // Content hamesha humara apna serialized object hai aur jsonLd()
      // `<` ko escape karta hai — koi tag break nahi ho sakta.
      dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
    />
  );
}

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CategoryPageClient from './CategoryPageClient';
import type { Category, PaginatedPhotos } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Props {
  params: { category: string };
}

async function getCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const categories: Category[] = await res.json();
    return categories.find((c) => c.slug === slug) || null;
  } catch {
    return null;
  }
}

async function getInitialPhotos(slug: string): Promise<PaginatedPhotos | null> {
  try {
    const res = await fetch(`${API_URL}/photos?category=${slug}&page=1&limit=20`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.category);
  if (!category) return { title: 'Not Found' };
  
  const title = `${category.name} — Photography Portfolio`;
  const description = category.description || `Browse ${category.name} photography`;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const ogImage = category.cover_photo?.public_id && cloudName
    ? `https://res.cloudinary.com/${cloudName}/image/upload/w_1200,h_630,c_fill,q_auto,f_auto/${category.cover_photo.public_id}`
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630 }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const [category, initialData] = await Promise.all([
    getCategory(params.category),
    getInitialPhotos(params.category),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <CategoryPageClient
      category={category}
      initialPhotos={initialData?.photos || []}
      initialPagination={initialData?.pagination || null}
    />
  );
}

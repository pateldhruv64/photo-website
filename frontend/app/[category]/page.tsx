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
    const res = await fetch(`${API_URL}/categories`, { next: { revalidate: 0 } });
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
      next: { revalidate: 0 },
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
  
  return {
    title: `${category.name} — Photography Portfolio`,
    description: category.description || `Browse ${category.name} photography`,
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

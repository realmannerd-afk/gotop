import { getByCategory, getCategories } from '@/data/db';
import { ProductCard } from '@/components/ProductCard';
import { ImpressionTracker } from '@/components/ImpressionTracker';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 60;

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const categories = await getCategories();
  const category = categories.find(c => c.slug === resolvedParams.slug);
  
  if (!category) return { title: 'Not Found' };
  
  return {
    title: `${category.name} Products - gotop`,
    description: `Discover the best ${category.name} products.`,
  };
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((category) => ({
      slug: category.slug,
    }));
  } catch (error) {
    return [];
  }
}

export default async function CategoryPage({ params }: Props) {
  const resolvedParams = await params;
  const categories = await getCategories();
  const category = categories.find(c => c.slug === resolvedParams.slug);
  
  if (!category) {
    notFound();
  }

  const products = await getByCategory(resolvedParams.slug);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-4 pb-16 space-y-8">
      <div className="space-y-4 max-w-2xl text-center mx-auto">
        <Link href="/category" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-2">
          <ArrowLeft className="w-4 h-4" />
          All Categories
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing products in the {category.name} category, ranked by bid.
        </p>
      </div>

      {products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} rank={index + 1} placement="category" />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-500 dark:text-gray-400">No products found in this category yet.</p>
        </div>
      )}
      <ImpressionTracker listingIds={products.map(p => p.id)} placement="category" />
    </div>
  );
}

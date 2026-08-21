import { getCategories } from '@/data/db';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Categories - gotop',
  description: 'Browse products by category.',
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-4 pb-16 space-y-8">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Explore products by their category.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((category) => {
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all"
            >
              <span className="font-semibold">{category.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

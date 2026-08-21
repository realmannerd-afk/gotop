import { getTrending } from '@/data/db';
import { ProductCard } from '@/components/ProductCard';
import { ImpressionTracker } from '@/components/ImpressionTracker';
import { TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Trending - gotop',
  description: 'Products receiving the most recent attention.',
};

export default async function TrendingPage() {
  const products = await getTrending();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-4 pb-16 space-y-8">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Trending Now</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Products receiving the most recent attention across the platform.
        </p>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} rank={index + 1} placement="trending" />
        ))}
      </div>
      <ImpressionTracker listingIds={products.map(p => p.id)} placement="trending" />
    </div>
  );
}

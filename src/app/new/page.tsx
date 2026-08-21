import { getNewest } from '@/data/db';
import { ProductCard } from '@/components/ProductCard';
import { ImpressionTracker } from '@/components/ImpressionTracker';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'New Arrivals - gotop',
  description: 'The newest active listings on gotop.',
};

export default async function NewPage() {
  const products = await getNewest();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-4 pb-16 space-y-8">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">New Arrivals</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The newest active listings competing for attention.
        </p>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} placement="new" />
        ))}
      </div>
      <ImpressionTracker listingIds={products.map(p => p.id)} placement="new" />
    </div>
  );
}

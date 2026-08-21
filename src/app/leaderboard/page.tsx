import { getLeaderboard } from '@/data/db';
import { ProductCard } from '@/components/ProductCard';
import { ImpressionTracker } from '@/components/ImpressionTracker';
import { Trophy } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Leaderboard - gotop',
  description: 'The top products competing for attention right now.',
};

export default async function LeaderboardPage() {
  const products = await getLeaderboard();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-4 pb-16 space-y-8">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Live Leaderboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ranked by current bid. Highest visibility goes to the top.
        </p>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} rank={index + 1} placement="leaderboard" />
        ))}
      </div>
      <ImpressionTracker listingIds={products.map(p => p.id)} placement="leaderboard" />
    </div>
  );
}

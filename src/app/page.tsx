import Link from 'next/link';
import { getLeaderboard } from '@/data/db';
import { ProductCard } from '@/components/ProductCard';
import { ImpressionTracker } from '@/components/ImpressionTracker';
import { OutbidHero } from '@/components/OutbidHero';
import { RefreshButton } from '@/components/RefreshButton';

export const revalidate = 60;

export default async function Home() {
  const [leaderboard] = await Promise.all([
    getLeaderboard()
  ]);

  const topBid = leaderboard.length > 0 ? leaderboard[0].currentBid : 0;
  const topProducts = leaderboard; // Show all products on homepage just like outbid

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pt-4 pb-16">
      <header className="mb-6 text-center">
        <h1 className="sr-only">gotop - The Pay to Win Leaderboard</h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-600">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-gray-900">Live</span>
          <span className="text-gray-300">|</span>
          <span>{leaderboard.length} active bids</span>
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          <RefreshButton />
        </div>
      </header>

      <div className="flex flex-col gap-10">
        <OutbidHero currentHighestBid={topBid} />

        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold text-gray-900">Live Leaderboard</h3>
            <span className="text-sm font-medium text-gray-500">Top 20</span>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} rank={index + 1} placement="homepage" />
            ))}
          </div>
        </div>
      </div>
      <ImpressionTracker listingIds={leaderboard.map(p => p.id)} placement="homepage" />
    </div>
  );
}

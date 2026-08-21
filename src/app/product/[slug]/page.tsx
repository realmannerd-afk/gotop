import { getProductBySlug, getLeaderboard } from '@/data/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ImpressionTracker } from '@/components/ImpressionTracker';
import { ArrowLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const revalidate = 60;

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);
  
  if (!product) return { title: 'Not Found' };
  
  return {
    title: `${product.name} - gotop`,
    description: product.description,
  };
}

export async function generateStaticParams() {
  try {
    const { data } = await supabase.from('listings').select('slug').eq('status', 'active');
    return (data || []).map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    return [];
  }
}

export default async function ProductPage({ params }: Props) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);
  
  if (!product) {
    notFound();
  }

  const leaderboard = await getLeaderboard();
  const currentRank = leaderboard.findIndex(p => p.id === product.id) + 1;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12">
      <div>
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center font-bold text-4xl md:text-5xl text-gray-700 dark:text-gray-300">
            {product.logoUrl}
          </div>

          <div className="flex-grow space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
                <Link 
                  href={`/category/${product.category.toLowerCase().replace(/\s+/g, '-')}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {product.category}
                </Link>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <a 
                href={`/go/${product.id}?placement=product`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white dark:focus:ring-offset-gray-950"
              >
                Visit Website
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <Link
                href="/submit" // In a real app this would go to a bid update flow, but we can reuse submit or a mock modal. For now, /submit
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-800 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-800"
              >
                Bid Higher
                <TrendingUp className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-gray-100 dark:border-gray-800">
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 space-y-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Rank</div>
          <div className="text-4xl font-bold flex items-baseline gap-2">
            #{currentRank}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">on leaderboard</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 space-y-2">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Bid</div>
          <div className="text-4xl font-bold flex items-baseline gap-2">
            ${product.currentBid}
          </div>
        </div>
      </div>
      <ImpressionTracker listingIds={[product.id]} placement="product" />
    </div>
  );
}

import Link from 'next/link';
import { Product } from '@/data/db';

interface ProductCardProps {
  product: Product;
  rank?: number;
  placement?: string;
}

export function ProductCard({ product, rank, placement = 'leaderboard' }: ProductCardProps) {
  const isTop3 = rank && rank <= 3;
  
  return (
    <div className={`relative flex items-center gap-3 md:gap-4 p-4 rounded-xl border ${isTop3 ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'} transition-shadow hover:shadow-md`}>
      {rank && (
        <div className={`flex-shrink-0 w-8 md:w-10 text-center font-bold text-lg md:text-xl ${isTop3 ? 'text-emerald-600' : 'text-gray-400'}`}>
          #{rank}
        </div>
      )}
      
      <Link href={`/product/${product.slug}`} className="flex-shrink-0">
        <span className="flex size-12 md:size-14 items-center justify-center rounded-xl bg-gray-100 text-lg font-bold text-gray-500 hover:opacity-80 transition-opacity overflow-hidden">
          {product.logoUrl ? (
            <img src={product.logoUrl} alt={product.name} className="w-full h-full object-contain bg-white" />
          ) : product.websiteUrl ? (
            <img src={`https://www.google.com/s2/favicons?domain=${product.websiteUrl.replace(/^https?:\/\//, '').split('/')[0]}&sz=64`} alt={product.name} className="w-8 h-8 object-contain" />
          ) : (
            product.name.charAt(0).toUpperCase()
          )}
        </span>
      </Link>
      
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <Link href={`/product/${product.slug}`} className="group inline-flex items-center gap-2 mb-0.5 w-fit">
          <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-base md:text-lg truncate">
            {product.name}
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
            {product.category}
          </span>
        </Link>
        <p className="text-sm text-gray-600 line-clamp-1 mb-1">{product.description}</p>
        <p className="text-xs text-gray-400 font-medium">
          {(product.currentBid * 12 + 342)} clicks
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0 pl-4 border-l border-gray-100">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Current Bid</span>
          <span className="font-bold text-lg text-gray-900">${product.currentBid}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <a 
            href={`/go/${product.id}?placement=${placement}`} 
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap text-center"
          >
            Visit
          </a>
          <Link 
            href={`/submit?url=${encodeURIComponent(product.websiteUrl)}`} 
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors whitespace-nowrap text-center"
          >
            Outbid →
          </Link>
        </div>
      </div>
    </div>
  );
}

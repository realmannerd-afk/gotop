'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCategories, submitListing } from '@/app/actions';
import { Loader2 } from 'lucide-react';

export function OutbidHero({ currentHighestBid }: { currentHighestBid: number }) {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const minBid = currentHighestBid ? currentHighestBid + 1 : 5;

  const handleOutbid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsCheckingOut(true);
    setErrorMsg('');

    try {
      const submitRes = await submitListing({
        url,
        name: '',
        description: '',
        category: 'Other',
        bid: minBid
      });

      if (submitRes.error) {
        setErrorMsg(submitRes.error);
        setIsCheckingOut(false);
        return;
      }

      if (submitRes.success && submitRes.listingId && submitRes.token) {
        sessionStorage.setItem(`manage_token_${submitRes.listingId}`, submitRes.token);
      }
      
      if (submitRes.checkoutUrl) {
        window.location.href = submitRes.checkoutUrl;
      }
    } catch (err) {
      setErrorMsg('Checkout failed. Please try again.');
      setIsCheckingOut(false);
    }
  };

  return (
    <form onSubmit={handleOutbid} className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-lg mx-auto">
      <input
        type="url"
        required
        placeholder="your-website.com"
        className="flex-1 px-5 py-3.5 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base shadow-sm"
        value={url}
        onChange={e => setUrl(e.target.value)}
        disabled={isCheckingOut}
      />
      <button 
        type="submit"
        disabled={isCheckingOut}
        className="px-8 py-3.5 bg-black hover:bg-gray-800 text-white rounded-full font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
      >
        {isCheckingOut ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
        ) : (
          `Outbid ($${minBid})`
        )}
      </button>
      {errorMsg && <p className="text-red-500 text-sm mt-2">{errorMsg}</p>}
    </form>
  );
}


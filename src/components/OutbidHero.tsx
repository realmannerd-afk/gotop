"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCategories, submitListing, createDodoCheckout } from '@/app/actions';
import { Loader2 } from 'lucide-react';

export function OutbidHero({ currentHighestBid }: { currentHighestBid: number }) {
  const router = useRouter();
  const [bid, setBid] = useState(Math.max(1, currentHighestBid + 1));
  const [url, setUrl] = useState('');
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories().then(cats => {
      if (cats && cats.length > 0) {
        setCategories(cats.map(c => c.name));
        setSelectedCategory(cats[0].name);
      }
    });
  }, []);

  // Extract domain for favicon
  let domain = '';
  try {
    const raw = url.trim();
    if (raw) {
      const formatted = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      domain = new URL(formatted).hostname;
    }
  } catch (e) {
    domain = '';
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !selectedCategory) return;
    
    setIsCheckingOut(true);
    setErrorMsg('');
    
    try {
      const submitRes = await submitListing({
        url,
        name: '',
        description: '',
        category: selectedCategory,
        bid
      });
      
      if (submitRes.error || !submitRes.listingId || !submitRes.token) {
        setErrorMsg(submitRes.error || 'Failed to submit listing');
        setIsCheckingOut(false);
        return;
      }
      
      sessionStorage.setItem(`gotop_token_${submitRes.listingId}`, submitRes.token);
      
      const dodoRes = await createDodoCheckout(submitRes.listingId);
      if (dodoRes.error) {
        setErrorMsg(dodoRes.error);
        setIsCheckingOut(false);
        return;
      }
      
      if (dodoRes.checkoutUrl) {
        window.location.href = dodoRes.checkoutUrl;
      }
    } catch (err) {
      setErrorMsg('Checkout failed. Please try again.');
      setIsCheckingOut(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 pt-4 pb-8">
      <h2 className="flex flex-wrap items-center justify-center gap-x-2 text-center text-[28px] font-bold tracking-tight md:text-[40px] text-gray-900">
        <span>Claim #1 for</span>
        <span className="inline-flex items-center gap-2">
          <button 
            type="button" 
            onClick={() => setBid(b => Math.max(1, b - 1))}
            className="inline-flex items-center justify-center rounded-full text-sm font-bold w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
          >
            -
          </button>
          <label className="relative inline-block text-emerald-600 underline decoration-2 decoration-dashed underline-offset-[6px]">
            <span className="invisible whitespace-nowrap tabular-nums" aria-hidden="true">${bid}</span>
            <span className="absolute inset-0 flex items-baseline">
              <span aria-hidden="true">$</span>
              <input 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                value={bid}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/[^0-9]/g, ''));
                  setBid(isNaN(val) ? 0 : val);
                }}
                className="w-full min-w-0 bg-transparent p-0 font-inherit tracking-inherit tabular-nums outline-none" 
              />
            </span>
          </label>
          <button 
            type="button" 
            onClick={() => setBid(b => b + 1)}
            className="inline-flex items-center justify-center rounded-full text-sm font-bold w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
          >
            +
          </button>
        </span>
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm font-medium leading-relaxed text-gray-500">
        <span className="text-emerald-600">New spots start at $1.</span> Paying less than the #1 price still puts you on the board at whatever place that bid can take.
      </p>

      
      
      <form onSubmit={handleCheckout} className="mt-6 flex flex-col max-w-2xl mx-auto w-full px-4">
        
        {/* URL Input Bar */}
        <div className="flex flex-col md:flex-row items-center bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 transition-all focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-400">
          <div className="relative flex-1 w-full flex items-center min-w-0">
            <span className="absolute left-4 w-6 h-6 rounded overflow-hidden flex items-center justify-center text-gray-400 shrink-0">
              {domain ? (
                <img src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} alt="Icon" className="w-full h-full object-contain" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
                  <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" strokeWidth="1.5"></ellipse>
                  <path d="M2 12H22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                </svg>
              )}
            </span>
            <input 
              required
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com" 
              className="w-full h-12 pl-14 pr-4 bg-transparent text-[15px] outline-none text-gray-900 placeholder:text-gray-400 font-medium" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isCheckingOut || !url || !selectedCategory}
            className="w-full md:w-auto h-12 mt-2 md:mt-0 px-10 rounded-xl bg-gray-900 text-white font-bold hover:bg-emerald-600 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Checkout'}
          </button>
        </div>
        
        {errorMsg && (
          <p className="text-red-500 text-sm text-center font-medium mt-4">{errorMsg}</p>
        )}

        {/* Category Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === c 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

      </form>


    </section>
  );
}

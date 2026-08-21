"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUrlMetadata, fetchCategories, submitListing, createDodoCheckout } from '@/app/actions';
import { Loader2, ArrowRight } from 'lucide-react';

export function OutbidHero({ currentHighestBid }: { currentHighestBid: number }) {
  const router = useRouter();
  const [bid, setBid] = useState(currentHighestBid + 1);
  const [url, setUrl] = useState('');
  
  // Modal state
  const [isFetching, setIsFetching] = useState(false);
  const [previewData, setPreviewData] = useState<{name: string, description: string, logo_url: string | null} | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsFetching(true);
    setErrorMsg('');
    
    try {
      const res = await fetchUrlMetadata(url);
      if (res.error) {
        setErrorMsg(res.error);
        setIsFetching(false);
        return;
      }
      
      const cats = await fetchCategories();
      if (cats && cats.length > 0) {
        setCategories(cats.map(c => c.name));
        setSelectedCategory(cats[0].name);
      }
      
      setPreviewData({
        name: res.name || '',
        description: res.description || '',
        logo_url: res.logo_url || null
      });
    } catch (err) {
      setErrorMsg('Failed to fetch website details');
    }
    
    setIsFetching(false);
  };

  const handleFinalCheckout = async () => {
    if (!previewData || !selectedCategory) return;
    
    setIsCheckingOut(true);
    setErrorMsg('');
    
    try {
      // 1. Create pending listing
      const submitRes = await submitListing({
        url,
        name: previewData.name,
        description: previewData.description,
        category: selectedCategory,
        bid
      });
      
      if (submitRes.error || !submitRes.listingId || !submitRes.token) {
        setErrorMsg(submitRes.error || 'Failed to submit listing');
        setIsCheckingOut(false);
        return;
      }
      
      // Store token safely in session storage just like the submit page does
      sessionStorage.setItem(gotop_token_, submitRes.token);
      
      // 2. Create Dodo Checkout
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
    <>
      <section className="flex flex-col gap-6 pt-4 pb-8">
        <h2 className="flex flex-wrap items-center justify-center gap-x-2 text-center text-[28px] font-bold tracking-tight md:text-[40px] text-gray-900">
          <span>Claim #1 for</span>
          <span className="inline-flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setBid(b => Math.max(5, b - 1))}
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
          <span className="text-emerald-600">New spots start at $5.</span> Paying less than the #1 price still puts you on the board at whatever place that bid can take.
        </p>

        <form onSubmit={handleInitialSubmit} className="mt-4 flex flex-col gap-3 max-w-2xl mx-auto w-full px-4">
          <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"></circle>
                  <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" strokeWidth="1.5"></ellipse>
                  <path d="M2 12H22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
                </svg>
              </span>
              <input 
                required
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Your product URL (e.g. example.com)" 
                className="w-full h-14 pl-13 pr-4 rounded-xl border border-gray-200 bg-white text-base outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isFetching}
              className="h-14 px-8 rounded-xl bg-gray-900 text-white font-bold hover:bg-emerald-600 transition-colors flex-shrink-0 disabled:opacity-50 flex items-center gap-2"
            >
              {isFetching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Checkout'}
            </button>
          </div>
          {errorMsg && !previewData && (
            <p className="text-red-500 text-sm text-center font-medium mt-2">{errorMsg}</p>
          )}
        </form>
      </section>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Your Product</h3>
              
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                {previewData.logo_url ? (
                  <img src={previewData.logo_url} alt="Logo" className="w-12 h-12 rounded-lg bg-white shadow-sm object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl">
                    {previewData.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <input 
                    type="text" 
                    value={previewData.name} 
                    onChange={(e) => setPreviewData({...previewData, name: e.target.value})}
                    className="w-full font-bold text-gray-900 bg-transparent border-b border-gray-200 focus:border-emerald-500 outline-none pb-1 mb-1"
                  />
                  <textarea 
                    value={previewData.description}
                    onChange={(e) => setPreviewData({...previewData, description: e.target.value})}
                    className="w-full text-sm text-gray-500 bg-transparent resize-none h-16 outline-none border-b border-gray-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white focus:border-emerald-500 outline-none"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {errorMsg && (
                <p className="text-red-500 text-sm font-medium mb-4">{errorMsg}</p>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setPreviewData(null)}
                  disabled={isCheckingOut}
                  className="flex-1 h-12 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFinalCheckout}
                  disabled={isCheckingOut}
                  className="flex-[2] h-12 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors flex flex-row items-center justify-center gap-2"
                >
                  {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Pay  <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

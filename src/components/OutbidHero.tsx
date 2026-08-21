"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function OutbidHero({ currentHighestBid }: { currentHighestBid: number }) {
  const router = useRouter();
  const [bid, setBid] = useState(currentHighestBid + 1);
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    router.push(`/submit?url=${encodeURIComponent(url)}&bid=${bid}`);
  };

  return (
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

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 max-w-2xl mx-auto w-full px-4">
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
              placeholder="Your product URL" 
              className="w-full h-14 pl-13 pr-4 rounded-xl border border-gray-200 bg-white text-base outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow" 
            />
          </div>
          <button 
            type="submit" 
            className="h-14 px-8 rounded-xl bg-gray-900 text-white font-bold hover:bg-emerald-600 transition-colors flex-shrink-0"
          >
            Checkout
          </button>
        </div>
      </form>
    </section>
  );
}

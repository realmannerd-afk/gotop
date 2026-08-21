"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCategories, fetchUrlMetadata, submitListing } from '@/app/actions';

type Step = 'url' | 'details' | 'bid';

function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || '';
  const initialBid = searchParams.get('bid') ? parseInt(searchParams.get('bid')!) : 5; 

  const [step, setStep] = useState<Step>('url');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    url: initialUrl,
    name: '',
    description: '',
    category: '',
    bid: Math.max(2, initialBid),
  });

  useEffect(() => {
    fetchCategories().then((data) => {
      if (data) {
        setCategories(data.map(d => d.name));
        if (!formData.category && data.length > 0) {
          setFormData(prev => ({ ...prev, category: data[0].name }));
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUrlSubmit = async (e: React.FormEvent, forceUrl?: string) => {
    e?.preventDefault();
    const targetUrl = forceUrl || formData.url;
    if (!targetUrl) return;
    
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await fetchUrlMetadata(targetUrl);
      if (res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        url: res.targetUrl || targetUrl,
        name: res.data?.title || '',
        description: res.data?.description || '',
      }));
      setStep('details');
    } catch (_err) {
      setErrorMsg('Failed to process URL');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUrl && step === 'url' && !loading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleUrlSubmit(new Event('submit') as unknown as React.FormEvent, initialUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (formData.name.length < 2) return setErrorMsg('Name must be at least 2 characters');
    if (formData.description.length < 20) return setErrorMsg('Description must be at least 20 characters');
    setStep('bid');
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (formData.bid < 2) return setErrorMsg('Minimum bid is $2');

    setLoading(true);
    try {
      const res = await submitListing(formData);
      if (res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      if (res.success && res.listingId && res.token) {
        sessionStorage.setItem(`manage_token_${res.listingId}`, res.token);
        router.push(`/checkout/${res.listingId}`);
      }
    } catch (_err) {
      setErrorMsg('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-12 md:py-24">
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Submit your product</h1>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <span className={cn(step === 'url' ? 'text-gray-900 dark:text-white' : 'text-gray-400')}>1. URL</span>
          <ArrowRight className="w-4 h-4" />
          <span className={cn(step === 'details' ? 'text-gray-900 dark:text-white' : 'text-gray-400')}>2. Details</span>
          <ArrowRight className="w-4 h-4" />
          <span className={cn(step === 'bid' ? 'text-gray-900 dark:text-white' : 'text-gray-400')}>3. Bid & Pay</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm">
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {errorMsg}
          </div>
        )}

        {step === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-1">Product URL</label>
              <input
                type="url"
                id="url"
                required
                placeholder="https://your-product.com"
                className="block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  id="name"
                  required
                  maxLength={80}
                  className="block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Short Description (min 20 chars)</label>
                <textarea
                  id="description"
                  required
                  maxLength={500}
                  minLength={20}
                  rows={2}
                  className="block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{formData.description.length}/500</p>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
                <select
                  id="category"
                  required
                  className="block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setErrorMsg(''); setStep('url'); }}
                className="px-6 py-3 text-sm font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors"
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {step === 'bid' && (
          <form onSubmit={handleBidSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50 flex items-start gap-3">
                <Target className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed">
                  The higher your bid, the higher you rank on the leaderboard. Ties are broken by who bid first. You can increase your bid at any time. Minimum bid is $2.
                </p>
              </div>
              
              <div>
                <label htmlFor="bid" className="block text-sm font-medium mb-1">Your Bid (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    id="bid"
                    min="2"
                    step="1"
                    required
                    className="block w-full pl-8 pr-3 py-4 text-xl font-bold border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    value={formData.bid}
                    onChange={(e) => setFormData(prev => ({ ...prev, bid: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setErrorMsg(''); setStep('details'); }}
                className="px-6 py-3 text-sm font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || formData.bid < 2}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Listing'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div className="p-24 text-center">Loading...</div>}>
      <SubmitForm />
    </Suspense>
  );
}

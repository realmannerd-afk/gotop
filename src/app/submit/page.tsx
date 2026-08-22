'use client';
import React from 'react';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCategories, fetchUrlMetadata, submitListing } from '@/app/actions';

type Step = 'url' | 'details' | 'bid';

function SubmitFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get('url') || '';
  const initialBid = searchParams.get('bid') ? parseInt(searchParams.get('bid')!) : 5; 

  const [step, setStep] = useState<Step>('url');
  
  const [formData, setFormData] = useState({
    url: initialUrl,
    name: '',
    description: '',
    category: '',
    bid: initialBid
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [metaLoading, setMetaLoading] = useState(false);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (step === 'url') {
      if (!formData.url) return setErrorMsg('URL is required');
      
      setMetaLoading(true);
      const res = await fetchUrlMetadata(formData.url);
      setMetaLoading(false);
      
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          url: res.targetUrl || prev.url,
          name: res.data?.title || '',
          description: res.data?.description || ''
        }));
      }
      setStep('details');
    } else if (step === 'details') {
      if (!formData.name) return setErrorMsg('Name is required');
      if (!formData.description) return setErrorMsg('Description is required');
      if (!formData.category) return setErrorMsg('Please select a category');
      setStep('bid');
    } else if (step === 'bid') {
      if (formData.bid < 1) return setErrorMsg('Minimum bid is $1');
      
      setLoading(true);
      try {
        const res = await submitListing(formData);
        if (res.error) {
          setErrorMsg(res.error);
          setLoading(false);
          return;
        }

        if (res.success && res.checkoutUrl) {
          if (res.listingId && res.token) {
            sessionStorage.setItem(`manage_token_${res.listingId}`, res.token);
          }
          window.location.href = res.checkoutUrl;
        }
      } catch (err) {
        setErrorMsg('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Submit to Leaderboard</h1>
        <p className="text-gray-500">Climb the ranks and get more eyes on your project.</p>
      </div>

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 -z-10 rounded" />
        {['url', 'details', 'bid'].map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-2 bg-white px-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2",
              step === s ? "border-blue-600 bg-blue-600 text-white" : 
              (i < ['url', 'details', 'bid'].indexOf(step) ? "border-blue-600 text-blue-600 bg-white" : "border-gray-200 text-gray-400 bg-white")
            )}>
              {i + 1}
            </div>
            <span className="text-xs font-medium text-gray-500 capitalize">{s}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleNext} className="space-y-6">
          
          {step === 'url' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="" disabled>Select a category</option>
                  <option value="AI">AI</option>
                  <option value="Apps">Apps</option>
                  <option value="Browser Extensions">Browser Extensions</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Databases">Databases</option>
                  <option value="Design">Design</option>
                  <option value="DevTools">DevTools</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Education">Education</option>
                  <option value="Finance">Finance</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Health">Health</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Open Source">Open Source</option>
                  <option value="Personal">Personal</option>
                  <option value="Productivity">Productivity</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Social">Social</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Max 500 chars)</label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 'bid' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start">
                <Target className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900 leading-relaxed">
                  Higher bids rank higher on the leaderboard. If someone outbids you later, your rank will drop until you increase your bid.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Bid (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="w-full pl-8 pr-4 py-3 text-lg font-semibold border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    value={formData.bid}
                    onChange={e => setFormData({...formData, bid: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <div className="pt-4 flex gap-3">
            {step !== 'url' && (
              <button
                type="button"
                onClick={() => setStep(step === 'bid' ? 'details' : 'url')}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || metaLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(loading || metaLoading) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === 'bid' ? (
                'Proceed to Payment'
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


export default function SubmitForm() {
  return (
    <React.Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <SubmitFormContent />
    </React.Suspense>
  );
}



'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Copy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const listingId = params.listingId as string;
  const rawToken = searchParams.get('token') || '';
  
  const [copied, setCopied] = useState(false);
  const [manageUrl, setManageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
       setManageUrl(`${window.location.origin}/manage/${listingId}/${rawToken}`);
    }
    if (rawToken) {
      sessionStorage.setItem(`manage_token_${listingId}`, rawToken);
    }
  }, [listingId, rawToken]);

  return (
    <div className="w-full max-w-xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
        
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Payment Complete!</h1>
        <p className="text-gray-500 mb-8">
          Your listing has been securely recorded. The leaderboard updates immediately.
        </p>

        <div className="bg-gray-50 rounded-xl p-6 text-left border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Save Your Management Link</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            You will need this secret link to edit your listing or increase your bid later. Do not share it publicly!
          </p>
          
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={manageUrl}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-mono focus:outline-none"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(manageUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2.5 text-gray-600 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-200 rounded-lg transition-colors shrink-0"
              title="Copy to clipboard"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-white bg-black hover:bg-gray-800 px-8 py-3 rounded-xl font-medium transition-colors"
        >
          View Leaderboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

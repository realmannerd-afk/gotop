"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCheckoutData, createDodoCheckout } from '@/app/actions';
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck, Copy } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [data, setData] = useState<{ listing: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, bid: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ } | null>(null);
  
  const [success, setSuccess] = useState(false);
  const [rankResult, setRankResult] = useState<number>(0);
  const [managementToken, setManagementToken] = useState<string | null>(null);

  useEffect(() => {
    // 10. SESSION STORAGE: check for token
    const storedToken = sessionStorage.getItem(`manage_token_${listingId}`);
    if (storedToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setManagementToken(storedToken);
    }

    async function loadData() {
      try {
        const res = await getCheckoutData(listingId);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.data) {
          setData(res.data);
        }
      } catch (err) {
        setErrorMsg('Failed to load checkout data.');
      } finally {
        setLoading(false);
      }
    }
    
    if (listingId) {
      loadData();
    }
  }, [listingId]);

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('status') === 'success') {
        setProcessing(true);
        const interval = setInterval(async () => {
          const data = await getCheckoutData(listingId as string);
          if (data?.isAlreadyActive) {
            clearInterval(interval);
            setSuccess(true);
            setProcessing(false);
          }
        }, 2000);
        return () => clearInterval(interval);
      }
    }
  }, [listingId]);

  const handlePayment = async () => {
    if (processing || !data) return;
    setProcessing(true);
    setErrorMsg('');

    try {
      const res = await createDodoCheckout(listingId);
        if (res.error) {
          setErrorMsg(res.error);
          setProcessing(false);
        } else if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        }
    } catch (err) {
      setErrorMsg('An unexpected error occurred during payment processing.');
      setProcessing(false);
    }
  };

  const copyManagementLink = () => {
    if (!managementToken) return;
    const url = `${window.location.origin}/manage/${listingId}/${managementToken}`;
    navigator.clipboard.writeText(url);
    alert('Management link copied to clipboard! Keep it safe.');
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // 12. FAILURE HANDLING
  if (errorMsg && !success) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="p-8 border border-red-100 rounded-2xl bg-red-50 text-red-900">
          <h2 className="text-xl font-bold mb-2">Checkout Error</h2>
          <p>{errorMsg}</p>
        </div>
        <Link href="/submit" className="inline-block font-medium text-gray-500 hover:text-gray-900 underline underline-offset-4">
          Return to Submission
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center space-y-10">
        <div className="space-y-6">
          <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">You&apos;re live.</h1>
            <p className="text-gray-500 mt-2">Your product is now on the leaderboard.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
            <p className="text-sm font-medium text-gray-500 mb-1">Your Rank</p>
            <p className="text-4xl font-bold text-gray-900">#{rankResult}</p>
          </div>
          <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <p className="text-sm font-medium text-emerald-700 mb-1">Current Bid</p>
            <p className="text-4xl font-bold text-emerald-700">${data?.bid?.amount || data?.listing?.current_bid}</p>
          </div>
        </div>

        <div className="pt-8 space-y-4 max-w-md mx-auto">
          <Link
            href={`/product/${data?.listing?.slug || listingId}`}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-white bg-gray-900 font-bold hover:bg-emerald-600 transition-colors"
          >
            View your listing
            <ArrowRight className="w-4 h-4" />
          </Link>

          {managementToken ? (
            <button
              onClick={copyManagementLink}
              className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-gray-900 bg-white border border-gray-200 font-bold hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4 text-gray-400" />
              Copy management link
            </button>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-900">
              Your listing was created, but your private management link is unavailable in this browser.
            </div>
          )}
          
          {managementToken && (
            <p className="text-xs text-gray-500">
              Save your management link! You will need it to update your listing or increase your bid later.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 md:py-24 grid md:grid-cols-2 gap-12">
      {/* Left: Summary */}
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Complete your listing</h1>
          <p className="text-gray-500">
            Review your product details and complete your initial bid payment to go live.
          </p>
        </div>

        <div className="p-6 border border-gray-200 rounded-2xl bg-white space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-2xl font-bold">
              {data.listing.logo_url ? (
                <img src={data.listing.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                data.listing.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{data.listing.name}</h3>
              <p className="text-sm text-gray-500">{data.listing.categories?.name || 'Category'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Description</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{data.listing.description}</p>
          </div>
        </div>
      </div>

      {/* Right: Payment */}
      <div className="p-8 border border-gray-200 rounded-3xl bg-gray-50 flex flex-col justify-center">
        <div className="text-center space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Amount to pay</p>
            <div className="text-6xl font-extrabold text-gray-900 tracking-tight">
              ${data.bid.amount}
            </div>
          </div>
          
          <div className="p-4 bg-emerald-100/50 rounded-xl flex items-start justify-center gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 font-medium">
              Your bid determines your position on the leaderboard. Ties are broken by who bid first.
            </p>
          </div>

          <div className="pt-4 space-y-3">
            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white bg-gray-900 font-bold text-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay $${data.bid.amount}`
              )}
            </button>
            
            <Link
              href="/submit"
              className="w-full flex items-center justify-center px-6 py-4 rounded-xl text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getManagementData, processRebidMock, updateListingDetails } from '@/app/manage/actions';
import { Loader2, TrendingUp, Eye, MousePointerClick, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function ManagementPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.listingId as string;
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>(null);
  const [error, setError] = useState('');

  // Rebid state
  const [rebidAmount, setRebidAmount] = useState<number>(0);
  const [isRebidding, setIsRebidding] = useState(false);
  const [rebidError, setRebidError] = useState('');
  const [rebidSuccess, setRebidSuccess] = useState<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', logoUrl: '' });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getManagementData(listingId, token);
        if (res.error) {
          setError(res.error);
        } else {
          if (res.data) setData(res.data);
          if (res.data) setEditForm({
            name: res.data?.listing.name,
            description: res.data?.listing.description,
            logoUrl: res.data?.listing.logo_url || ''
          });
          if (res.data) setRebidAmount(res.data.listing.current_bid + 1);
        }
      } catch (err) {
        setError('Failed to load management dashboard');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [listingId, token]);

  const handleRebid = async () => {
    if (!data) return;
    setRebidError('');
    setRebidSuccess(null);
    if (rebidAmount <= data.listing.current_bid) {
      return setRebidError(`Bid must be greater than current bid ($${data.listing.current_bid})`);
    }

    setIsRebidding(true);
    try {
      const res = await processRebidMock(listingId, token, rebidAmount);
      if (res.error) {
        setRebidError(res.error);
      } else {
        setRebidSuccess({
          newRank: res.rank,
          newBid: res.newBid,
          amountPaid: res.amountPaid
        });
        // Refresh data silently
        const refresh = await getManagementData(listingId, token);
        if (refresh.data) setData(refresh.data);
      }
    } catch (err) {
      setRebidError('An error occurred during payment');
    } finally {
      setIsRebidding(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      const res = await updateListingDetails(listingId, token, editForm);
      if (res.error) {
        alert(res.error);
      } else {
        setIsEditing(false);
        const refresh = await getManagementData(listingId, token);
        if (refresh.data) setData(refresh.data);
      }
    } catch (err) {
      alert('Failed to save details');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const isNumberOne = data?.currentRank === 1;
  const targetRecommendation = useMemo(() => {
    if (isNumberOne || !data) return null;
    return data.numberOneBid + 1;
  }, [isNumberOne, data]);

  if (loading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="p-8 border border-red-100 rounded-2xl bg-red-50 text-red-900">
          <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const { listing, analytics, bidHistory, currentRank, numberOneBid } = data;
  

  // Moved up

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Management Dashboard</h1>
          <p className="text-gray-500 mt-2">Manage your listing and track performance.</p>
        </div>
        <Link 
          href={`/product/${listing.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
        >
          View Public Page <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Edit */}
        <div className="lg:col-span-1 space-y-8">
          {/* Identity */}
          <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Product Details</h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm(prev => ({...prev, name: e.target.value}))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Logo URL</label>
                  <input 
                    type="url" 
                    value={editForm.logoUrl} 
                    onChange={e => setEditForm(prev => ({...prev, logoUrl: e.target.value}))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea 
                    value={editForm.description} 
                    onChange={e => setEditForm(prev => ({...prev, description: e.target.value}))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none"
                    rows={3}
                  />
                </div>
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400 overflow-hidden flex-shrink-0">
                  {listing.logo_url ? <img src={listing.logo_url} referrerPolicy="no-referrer" alt="Logo" className="w-full h-full object-cover" /> : listing.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{listing.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{listing.description}</p>
                </div>
              </div>
            )}
          </div>


          {/* Stats */}
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900">Analytics</h2>
            <div className="grid gap-4">
              {[
                { label: 'All Time', data: analytics?.allTime || { impressions: 0, clicks: 0 } },
                { label: 'Last 7 Days', data: analytics?.last7d || { impressions: 0, clicks: 0 } },
                { label: 'Last 24 Hours', data: analytics?.last24h || { impressions: 0, clicks: 0 } },
              ].map(stat => {
                const ctr = stat.data.impressions > 0 ? ((stat.data.clicks / stat.data.impressions) * 100).toFixed(2) : '0.00';
                return (
                  <div key={stat.label} className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">Impressions</p>
                        <p className="text-lg font-bold text-gray-900">{stat.data.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">Clicks</p>
                        <p className="text-lg font-bold text-gray-900">{stat.data.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">CTR</p>
                        <p className="text-lg font-bold text-emerald-600">{ctr}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Bidding & Rank */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Status Banner */}
          <div className={`p-8 rounded-3xl text-white ${isNumberOne ? 'bg-amber-500' : 'bg-gray-900'}`}>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {isNumberOne ? "🏆 You're #1" : "You've been outbid."}
                </h2>
                <p className="opacity-90">
                  {isNumberOne 
                    ? "Your product is currently holding the top spot on the leaderboard." 
                    : `The top bid is currently $${numberOneBid}.`}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-medium opacity-80 uppercase tracking-wide">Current Rank</p>
                <p className="text-6xl font-extrabold">#{currentRank}</p>
              </div>
            </div>
          </div>

          {/* Rebid Section */}
          <div className="p-8 bg-white border border-gray-200 rounded-3xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Increase your bid</h3>
            
            {rebidSuccess && (
              <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-3 text-emerald-800 mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                  <h4 className="font-bold text-lg">Bid updated successfully!</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-600/70">New Rank</p>
                    <p className="text-2xl font-black text-emerald-900">#{rebidSuccess.newRank}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-600/70">New Bid</p>
                    <p className="text-2xl font-black text-emerald-900">${rebidSuccess.newBid}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-emerald-600/70">Amount Paid</p>
                    <p className="text-2xl font-black text-emerald-900">${rebidSuccess.amountPaid}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/leaderboard" className="text-sm font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4">
                    View Leaderboard
                  </Link>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Current Bid</label>
                  <div className="text-3xl font-bold text-gray-400">${listing.current_bid}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Bid Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input 
                      type="number"
                      min={listing.current_bid + 1}
                      step={1}
                      value={rebidAmount || ''}
                      onChange={e => setRebidAmount(parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-4 text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
                    />
                  </div>
                </div>
                
                {targetRecommendation && (
                  <button 
                    onClick={() => setRebidAmount(targetRecommendation)}
                    className="w-full p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-left hover:bg-emerald-100 transition-colors"
                  >
                    <p className="text-sm font-medium mb-1">Recommendation</p>
                    <p className="font-bold">Bid ${targetRecommendation} to take #1</p>
                  </button>
                )}
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Amount you need to pay</p>
                  <p className="text-5xl font-black text-gray-900">
                    ${Math.max(0, rebidAmount - listing.current_bid)}
                  </p>
                </div>
                
                <p className="text-xs text-gray-500 leading-relaxed">
                  You only pay the difference between your new bid and your current bid. Your exact resulting rank will be calculated live based on active competing bids.
                </p>

                {rebidError && (
                  <p className="text-sm font-bold text-red-600">{rebidError}</p>
                )}

                <button
                  onClick={handleRebid}
                  disabled={isRebidding || rebidAmount <= listing.current_bid}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRebidding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay & Update Bid'}
                </button>
              </div>
            </div>
          </div>

          {/* Bid History */}
          {bidHistory && bidHistory.length > 0 && (
            <div className="p-8 bg-white border border-gray-200 rounded-3xl shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Bid History</h3>
              <div className="space-y-4">
                {bidHistory.map((b: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        {b.previous_amount === 0 ? `Initial Bid: $${b.amount}` : `$${b.previous_amount} → $${b.amount}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">Paid ${b.amount_paid}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${b.status === 'paid' || b.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

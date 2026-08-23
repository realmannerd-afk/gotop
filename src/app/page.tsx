'use client';

import { useState, useEffect } from 'react';
import { getStats, getRecentClaims, claimSpace, Space } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';
import Link from 'next/link';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claimed, setClaimed] = useState(0);
  const [recentClaims, setRecentClaims] = useState<Space[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{id: number, message: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  // Initial load
  useEffect(() => {
    async function load() {
      const stats = await getStats();
      const recent = await getRecentClaims();
      setClaimed(stats.claimed);
      setRecentClaims(recent);
      setLoading(false);
    }
    load();
  }, []);

  // Polling for updates every 10s
  useEffect(() => {
    const timer = setInterval(async () => {
      const stats = await getStats();
      const recent = await getRecentClaims();
      setClaimed(stats.claimed);
      setRecentClaims(recent);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const remaining = TOTAL_SPACES - claimed;
  const percentage = ((claimed / TOTAL_SPACES) * 100).toFixed(2);

  const handleClaimSubmit = async (message: string) => {
    setClaiming(true);
    const res = await claimSpace(message);
    setClaiming(false);
    
    if (res.error) {
      alert(res.error);
      return;
    }
    
    if (res.success && res.id) {
      setIsModalOpen(false);
      setClaimed(prev => prev + 1);
      const newClaim: Space = { id: res.id, message, claimedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) };
      setRecentClaims(current => [newClaim, ...current].slice(0, 10));
      setSuccessState({ id: res.id, message });
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]" />;
  }

  if (successState) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-1000 h-full w-full">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-[#FF3300]">
          YOU HAVE A PIECE<br />OF THE INTERNET.
        </h1>
        <div className="bg-white border border-[#E5E5E5] p-6 max-w-md w-full my-6 shadow-sm">
          <p className="font-mono text-gray-400 mb-4">#{successState.id.toLocaleString()}</p>
          <p className="text-xl font-medium text-black">&quot;{successState.message}&quot;</p>
          <p className="text-xs text-gray-500 mt-6">Claimed: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div className="flex gap-4 w-full max-w-md">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
              alert("Link copied!");
            }}
            className="flex-1 border border-[#E5E5E5] bg-white text-black font-bold py-3 hover:bg-black hover:border-black hover:text-white transition-colors text-xs uppercase tracking-widest"
          >
            Copy Link
          </button>
          <button 
            onClick={() => window.open(`https://x.com/intent/tweet?text=I%20own%20a%20piece%20of%20the%20Internet.%20Space%20%23${successState.id}`, '_blank')}
            className="flex-1 border border-[#E5E5E5] bg-white text-black font-bold py-3 hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:text-white transition-colors text-xs uppercase tracking-widest"
          >
            Share
          </button>
        </div>
        
        <button 
          onClick={() => setSuccessState(null)}
          className="mt-8 text-xs text-gray-400 hover:text-black transition-colors underline underline-offset-4"
        >
          VIEW THE INTERNET
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-full w-full p-4 md:p-8 max-w-[1400px] mx-auto items-center justify-between">
      {/* HEADER */}
      <div className="text-center shrink-0 w-full pt-2 md:pt-4">
        <p className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 mb-2 font-bold uppercase">
          The internet is running out
        </p>
        <h1 className="text-5xl md:text-8xl lg:text-[110px] font-bold tracking-tighter leading-none text-black">
          {remaining.toLocaleString()}
        </h1>
        <p className="text-sm tracking-widest text-gray-400 font-medium uppercase mt-2">
          Spaces Left
        </p>
      </div>

      {/* GRID */}
      <div className="w-full flex-1 min-h-0 flex items-center justify-center my-4">
        <div className="h-full w-full max-w-[60vh] max-h-[60vh] aspect-square">
          <GridVisual total={TOTAL_SPACES} claimed={claimed} />
          
          <div className="mt-3 flex justify-between items-center text-[10px] md:text-xs font-mono text-gray-500 uppercase">
            <span>{claimed.toLocaleString()} claimed</span>
            <span className="text-[#FF3300] font-bold">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* FOOTER & CTA */}
      <div className="shrink-0 w-full flex flex-col items-center pb-2">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white font-bold py-4 px-10 hover:bg-[#FF3300] transition-colors duration-300 uppercase tracking-widest text-sm shadow-xl"
        >
          Claim Your Space
        </button>

        {recentClaims.length > 0 && (
          <div className="mt-6 w-full max-w-4xl flex gap-3 overflow-hidden justify-center items-center h-12">
            <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase whitespace-nowrap hidden sm:block">Recent:</span>
            {recentClaims.slice(0, 4).map((space, idx) => (
              <Link href={`/space/${space.id}`} key={`${space.id}-${idx}`} className="flex-1 min-w-0 group block border border-[#E5E5E5] bg-white hover:border-black px-3 py-2 text-xs truncate transition-colors text-black">
                <span className="font-mono text-[9px] text-gray-400 mr-2">#{space.id}</span>
                &quot;{space.message}&quot;
              </Link>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ClaimModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleClaimSubmit} 
          isSubmitting={claiming}
        />
      )}
    </main>
  );
}

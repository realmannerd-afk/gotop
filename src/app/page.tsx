'use client';

import { useState, useEffect } from 'react';
import { TOTAL_SPACES, INITIAL_CLAIMED, RECENT_CLAIMS, Space } from '@/lib/mock-data';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';
import Link from 'next/link';

export default function Home() {
  const [claimed, setClaimed] = useState(INITIAL_CLAIMED);
  const [recentClaims, setRecentClaims] = useState<Space[]>(RECENT_CLAIMS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{id: number, message: string} | null>(null);

  // Mock activity loop
  useEffect(() => {
    const minTime = 3000;
    const maxTime = 12000;
    let timer: NodeJS.Timeout;

    const simulateActivity = () => {
      setClaimed(prev => {
        const nextId = prev + 1;
        
        // Add to recent claims
        setRecentClaims(current => {
          const newClaim: Space = {
            id: nextId,
            message: Math.random() > 0.7 ? "Just claimed my spot." : (Math.random() > 0.5 ? "hello internet" : "I was here."),
            claimedAt: "23 August 2026"
          };
          return [newClaim, ...current].slice(0, 5); // keep latest 5
        });

        return nextId;
      });
      
      const nextDelay = Math.random() * (maxTime - minTime) + minTime;
      timer = setTimeout(simulateActivity, nextDelay);
    };

    timer = setTimeout(simulateActivity, Math.random() * 5000 + 2000);
    return () => clearTimeout(timer);
  }, []);

  const remaining = TOTAL_SPACES - claimed;
  const percentage = ((claimed / TOTAL_SPACES) * 100).toFixed(2);
  const nextSpaceId = claimed + 1;

  const handleSuccess = (message: string) => {
    setIsModalOpen(false);
    setClaimed(prev => prev + 1);
    setRecentClaims(current => {
      const newClaim: Space = { id: nextSpaceId, message, claimedAt: "23 August 2026" };
      return [newClaim, ...current].slice(0, 5);
    });
    setSuccessState({ id: nextSpaceId, message });
  };

  if (successState) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 min-h-screen">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-[#FF3300]">
          YOU HAVE A PIECE<br />OF THE INTERNET.
        </h1>
        <div className="bg-white border border-[#E5E5E5] p-8 max-w-md w-full my-8 shadow-sm">
          <p className="font-mono text-gray-400 mb-4">#{successState.id.toLocaleString()}</p>
          <p className="text-xl md:text-2xl font-medium text-black">&quot;{successState.message}&quot;</p>
          <p className="text-sm text-gray-500 mt-8">Claimed: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
              alert("Link copied!");
            }}
            className="flex-1 border border-[#E5E5E5] bg-white text-black font-bold py-4 hover:bg-black hover:border-black hover:text-white transition-colors text-sm uppercase tracking-widest"
          >
            Copy Link
          </button>
          <button 
            onClick={() => window.open(`https://x.com/intent/tweet?text=I%20own%20a%20piece%20of%20the%20Internet.%20Space%20%23${successState.id}`, '_blank')}
            className="flex-1 border border-[#E5E5E5] bg-white text-black font-bold py-4 hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:text-white transition-colors text-sm uppercase tracking-widest"
          >
            Share
          </button>
        </div>
        
        <button 
          onClick={() => setSuccessState(null)}
          className="mt-12 text-sm text-gray-400 hover:text-black transition-colors underline underline-offset-4"
        >
          VIEW THE INTERNET
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-12 md:py-16 max-w-[1200px] mx-auto w-full">
      <div className="text-center mb-8">
        <p className="text-xs md:text-sm tracking-[0.2em] text-gray-400 mb-4 font-bold">
          THE INTERNET IS RUNNING OUT
        </p>
        <h1 className="text-6xl md:text-[120px] font-bold tracking-tighter leading-none mb-4 text-black">
          {remaining.toLocaleString()}
        </h1>
        <p className="text-lg md:text-xl tracking-widest text-gray-400 font-medium">
          SPACES LEFT
        </p>
      </div>

      <div className="w-full max-w-[800px] mx-auto mb-16 relative">
        <GridVisual total={TOTAL_SPACES} claimed={claimed} />
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-xs md:text-sm font-mono text-gray-500 gap-2">
          <div className="flex items-center gap-4">
            <span>{claimed.toLocaleString()} claimed</span>
            <span>{remaining.toLocaleString()} remaining</span>
          </div>
          <div className="text-[#FF3300] font-bold">{percentage}% CLAIMED</div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-24">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] transition-colors duration-300 uppercase tracking-widest text-sm sm:text-base shadow-xl hover:shadow-2xl hover:shadow-[#FF3300]/20"
        >
          Claim Your Space
        </button>
        <p className="mt-4 text-xs text-gray-400 tracking-widest uppercase font-bold">
          Once it&apos;s gone, it&apos;s gone.
        </p>
      </div>

      <div className="border-t border-[#E5E5E5] pt-12 max-w-4xl mx-auto w-full">
        <h3 className="text-xs font-bold tracking-widest text-gray-400 mb-8 uppercase text-center md:text-left">Recently Claimed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {recentClaims.map((space, idx) => (
            <Link href={`/space/${space.id}`} key={`${space.id}-${idx}`} className="block group">
              <div className="bg-white border border-[#E5E5E5] p-6 hover:border-black transition-colors h-full flex flex-col justify-between shadow-sm">
                <p className="text-black font-medium line-clamp-3 mb-4 text-sm">&quot;{space.message}&quot;</p>
                <p className="text-[10px] font-mono text-gray-400">#{space.id.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <ClaimModal 
          spaceId={nextSpaceId} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      )}
    </main>
  );
}

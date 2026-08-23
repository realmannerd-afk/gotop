'use client';

import { useState, useEffect } from 'react';
import { getStats, getAllClaims, claimSpace, Space } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claimed, setClaimed] = useState(734199); // Optimistic initial state
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{id: number, message: string} | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stats = await getStats();
        const allSpaces = await getAllClaims();
        setClaimed(stats.claimed);
        setSpaces(allSpaces);
      } catch (err) {
        console.error("Failed to load initial data:", err);
      }
    }
    load();
  }, []);

  const remaining = TOTAL_SPACES - claimed;
  const nextId = claimed + 1; 

  const handleClaimSubmit = async (message: string) => {
    setClaiming(true);
    try {
      const res = await claimSpace(message);
      setClaiming(false);
      
      if (res.error) {
        alert(res.error);
        return;
      }
      
      if (res.success && res.id) {
        setIsModalOpen(false);
        setClaimed(prev => prev + 1);
        
        const newClaim: Space = { 
          id: res.id, 
          message, 
          claimedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) 
        };
        
        setSpaces(current => [newClaim, ...current].slice(0, 10));
        setSuccessState({ id: res.id, message });
      }
    } catch (err) {
      setClaiming(false);
      alert("Failed to claim. Please try again.");
    }
  };

  if (successState) {
    return (
      <main className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 selection:bg-black selection:text-[#FAFAFA]">
        <div className="max-w-md w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-black mb-10 uppercase leading-snug">
            YOU HAVE A PIECE<br/>OF THE INTERNET.
          </h1>
          
          <div className="bg-white border border-black/10 p-10 md:p-14 w-full mb-10 relative overflow-hidden shadow-xl">
            <p className="font-mono text-black/40 mb-8 text-[10px] uppercase tracking-widest">Space #{successState.id.toLocaleString()}</p>
            <p className="text-xl md:text-2xl font-medium text-black leading-snug mb-8">
              &quot;{successState.message}&quot;
            </p>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40">
              Claimed: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="w-full flex gap-4 mb-6">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
                alert("Link copied!");
              }}
              className="flex-1 border border-black/10 bg-white shadow-sm text-black font-bold py-4 hover:bg-black hover:text-[#FAFAFA] transition-colors text-[10px] uppercase tracking-widest"
            >
              COPY LINK
            </button>
            <button 
              onClick={() => window.open(`https://x.com/intent/tweet?text=I%20own%20a%20piece%20of%20the%20Internet.%0A%0ASpace%20%23${successState.id}%0A%0ATHE%20INTERNET%20IS%20RUNNING%20OUT.`, '_blank')}
              className="flex-1 border border-black/10 bg-white shadow-sm text-black font-bold py-4 hover:bg-[#1DA1F2] hover:border-transparent hover:text-white transition-colors text-[10px] uppercase tracking-widest"
            >
              SHARE YOUR SPACE
            </button>
          </div>
          
          <button 
            onClick={() => setSuccessState(null)}
            className="w-full border border-black bg-black text-white font-bold py-4 hover:bg-[#FF3300] hover:border-transparent transition-colors text-[10px] uppercase tracking-widest"
          >
            VIEW THE INTERNET
          </button>
        </div>
      </main>
    );
  }

  // Progress Bar Calc
  const pct = (claimed / TOTAL_SPACES) * 100;
  const pctString = pct.toFixed(2);
  const filledBars = Math.min(20, Math.floor((pct / 100) * 20));
  const emptyBars = 20 - filledBars;
  const barString = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col selection:bg-black selection:text-white text-black py-16 md:py-24">
      
      <main className="flex-1 flex flex-col items-center w-full max-w-5xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="w-full text-center">
          <h2 className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-black/60">
            The Internet Is Running Out
          </h2>
        </div>

        {/* COUNTER */}
        <div className="flex flex-col items-center justify-center w-full mt-6 md:mt-10">
          <h1 className="text-[18vw] md:text-[140px] leading-none font-bold tracking-tighter tabular-nums text-black">
            {remaining.toLocaleString()}
          </h1>
          <p className="text-[10px] md:text-xs tracking-[0.2em] font-bold uppercase mt-4 text-black/60">
            SPACES LEFT
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex flex-col items-center mt-12 md:mt-16 w-full max-w-lg font-mono">
          <p className="text-sm md:text-base tracking-[0.3em] mb-2">{barString}</p>
          <p className="text-xs font-bold">{pctString}% CLAIMED</p>
          <div className="flex justify-between w-full mt-6 text-[10px] uppercase tracking-widest text-black/50 px-8">
            <span>{claimed.toLocaleString()} claimed</span>
            <span>{remaining.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* GRID */}
        <div className="w-full mt-16 md:mt-24">
          <GridVisual claimed={claimed} />
        </div>
        
        {/* RECENTLY CLAIMED */}
        <div className="w-full max-w-2xl mx-auto mt-12 mb-20 text-center">
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 mb-6">Recently Claimed</h3>
          <div className="flex flex-col gap-3">
            {spaces.map(s => (
              <div key={s.id} className="text-xs md:text-sm text-black flex justify-center gap-4 font-medium">
                <span className="font-mono text-black/40">#{s.id}</span>
                <span>&quot;{s.message}&quot;</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA FOOTER */}
        <div className="w-full flex flex-col items-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-12 py-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#FF3300] transition-colors shadow-xl"
          >
            CLAIM YOUR SPACE
          </button>
          <p className="mt-4 text-[9px] md:text-[10px] tracking-[0.2em] font-bold uppercase text-black/40">
            Once it&apos;s gone, it&apos;s gone.
          </p>
        </div>

      </main>

      {/* MODAL */}
      {isModalOpen && (
        <ClaimModal 
          spaceId={nextId}
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleClaimSubmit} 
          isSubmitting={claiming}
        />
      )}
    </div>
  );
}

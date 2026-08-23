'use client';

import { useState, useEffect } from 'react';
import { getStats, getAllClaims, claimSpace, Space } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claimed, setClaimed] = useState(734199);
  const [claimedIds, setClaimedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{pixels: number, message: string} | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const stats = await getStats();
        const allSpaces = await getAllClaims();
        setClaimed(stats.claimed);
        setClaimedIds(allSpaces.map(s => s.id));
      } catch (err) {}
    }
    load();
  }, []);

  const handleClaimSubmit = async (message: string) => {
    setClaiming(true);
    try {
      // We simulate claiming N pixels for the demo by just calling claim once, 
      // but treating it visually as a successful batch.
      const res = await claimSpace(message);
      setClaiming(false);
      
      if (res.error) {
        alert(res.error);
        return;
      }
      
      if (res.success && res.id) {
        setIsModalOpen(false);
        setClaimed(prev => prev + selectionCount);
        
        // Add a chunk of fake IDs for visual update
        const newIds = Array.from({length: selectionCount}, (_, i) => res.id + i);
        setClaimedIds(prev => [...prev, ...newIds]);
        
        setSuccessState({ pixels: selectionCount, message });
        setSelectionCount(0);
      }
    } catch (err) {
      setClaiming(false);
    }
  };

  if (successState) {
    return (
      <main className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 selection:bg-white selection:text-black">
        <div className="max-w-md w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-white mb-10 uppercase leading-snug">
            PIXELS SECURED.
          </h1>
          
          <div className="bg-black border border-white/20 p-10 md:p-14 w-full mb-10 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.05)]">
            <p className="font-mono text-white/50 mb-8 text-[10px] uppercase tracking-widest">{successState.pixels.toLocaleString()} Pixels</p>
            <p className="text-xl md:text-2xl font-medium text-white leading-snug mb-8">
              &quot;{successState.message}&quot;
            </p>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30">
              Claimed: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <div className="w-full flex gap-4 mb-6">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin);
                alert("Link copied!");
              }}
              className="flex-1 border border-white/20 bg-transparent text-white font-bold py-4 hover:bg-white hover:text-black transition-colors text-[10px] uppercase tracking-widest"
            >
              COPY LINK
            </button>
            <button 
              onClick={() => window.open(`https://x.com/intent/tweet?text=I%20just%20claimed%20${successState.pixels}%20pixels%20of%20the%20Internet.%0A%0ATHE%20INTERNET%20IS%20RUNNING%20OUT.`, '_blank')}
              className="flex-1 border border-white/20 bg-transparent text-white font-bold py-4 hover:bg-[#1DA1F2] hover:border-transparent hover:text-white transition-colors text-[10px] uppercase tracking-widest"
            >
              SHARE
            </button>
          </div>
          
          <button 
            onClick={() => setSuccessState(null)}
            className="w-full border border-white bg-white text-black font-bold py-4 hover:bg-gray-300 transition-colors text-[10px] uppercase tracking-widest"
          >
            RETURN TO CANVAS
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black flex flex-col selection:bg-white selection:text-black text-white relative overflow-hidden">
      
      {/* ABSOLUTE BACKGROUND TITLE */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10 pointer-events-none">
        <h2 className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-white/50">
          The Internet Is Running Out
        </h2>
        <p className="text-xl md:text-2xl font-mono mt-2 tracking-tighter">
          {(TOTAL_SPACES - claimed).toLocaleString()} PIXELS LEFT
        </p>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="flex-1 w-full flex flex-col items-center justify-center p-6 md:p-12 mt-16 md:mt-0">
        <GridVisual 
          total={TOTAL_SPACES} 
          claimedIds={claimedIds} 
          onSelectionChange={setSelectionCount}
        />
        <p className="mt-6 text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
          Click and drag to select pixels
        </p>
      </div>

      {/* FLOATING ACTION BAR */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-4 flex items-center justify-between gap-8 md:gap-16 shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-300 transform ${selectionCount > 0 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-bold text-black/50">Selected</span>
          <span className="font-mono text-xl md:text-2xl font-bold tracking-tighter leading-none mt-1">
            {selectionCount.toLocaleString()}
          </span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#FF3300] transition-colors"
        >
          CLAIM NOW
        </button>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <ClaimModal 
          pixels={selectionCount}
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleClaimSubmit} 
          isSubmitting={claiming}
        />
      )}
    </div>
  );
}

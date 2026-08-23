'use client';

import { useState, useEffect } from 'react';
import { getClaims, claimArea, Claim } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{pixels: number, name: string} | null>(null);
  const [claiming, setClaiming] = useState(false);
  
  const [mode, setMode] = useState<'pan' | 'select'>('pan');
  const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const c = await getClaims();
        setClaims(c);
      } catch (err) {}
    }
    load();
  }, []);

  const handleClaimSubmit = async (name: string, url: string) => {
    if (!selection) return;
    setClaiming(true);
    try {
      const res = await claimArea(name, url, selection.x, selection.y, selection.w, selection.h);
      setClaiming(false);
      
      if (res.error) {
        alert(res.error);
        return;
      }
      
      if (res.success && res.claim) {
        setIsModalOpen(false);
        setClaims(prev => [...prev, res.claim!]);
        setSuccessState({ pixels: selection.w * selection.h, name });
        setSelection(null);
        setMode('pan'); // auto switch back to pan
      }
    } catch (err) {
      setClaiming(false);
    }
  };

  const claimedCount = claims.reduce((acc, c) => acc + (c.w * c.h), 0);
  const selectionPixels = selection ? selection.w * selection.h : 0;

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
              Owned by {successState.name}
            </p>
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
    <div className="h-screen w-full bg-black flex flex-col selection:bg-white selection:text-black text-white relative overflow-hidden">
      
      {/* ABSOLUTE BACKGROUND TITLE */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10 pointer-events-none">
        <h2 className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-white/50">
          The Internet Is Running Out
        </h2>
        <p className="text-xl md:text-2xl font-mono mt-2 tracking-tighter">
          {(TOTAL_SPACES - claimedCount).toLocaleString()} PIXELS LEFT
        </p>
      </div>

      {/* MODE TOGGLE */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 z-10 flex gap-2">
        <button 
          onClick={() => setMode('pan')}
          className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest border transition-colors ${mode === 'pan' ? 'bg-white text-black border-white' : 'bg-black text-white/50 border-white/20 hover:text-white'}`}
        >
          🖐️ Pan / Zoom
        </button>
        <button 
          onClick={() => setMode('select')}
          className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest border transition-colors ${mode === 'select' ? 'bg-white text-black border-white' : 'bg-black text-white/50 border-white/20 hover:text-white'}`}
        >
          🔲 Select
        </button>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="flex-1 w-full h-full">
        <GridVisual 
          claims={claims} 
          mode={mode}
          onSelectionChange={setSelection}
        />
      </div>

      {/* HELP TEXT */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none hidden md:block">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
          Scroll to zoom
        </p>
      </div>

      {/* FLOATING ACTION BAR */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-4 flex items-center justify-between gap-8 md:gap-16 shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-300 transform ${selectionPixels > 0 ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest font-bold text-black/50">Selected</span>
          <span className="font-mono text-xl md:text-2xl font-bold tracking-tighter leading-none mt-1">
            {selectionPixels.toLocaleString()}
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
          pixels={selectionPixels}
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleClaimSubmit} 
          isSubmitting={claiming}
        />
      )}
    </div>
  );
}

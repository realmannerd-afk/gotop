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
      }
    } catch (err) {
      setClaiming(false);
    }
  };

  const claimedCount = claims.reduce((acc, c) => acc + (c.w * c.h), 0);
  const selectionPixels = selection ? selection.w * selection.h : 0;

  if (successState) {
    return (
      <main className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 selection:bg-white selection:text-black">
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
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col text-white">
      
      {/* HEADER */}
      <header className="shrink-0 w-full flex items-center justify-between p-6 border-b border-white/10 bg-black z-20">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tighter uppercase">
            1 Million Pixels
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mt-1">
            The Internet is running out
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg md:text-xl font-bold">
            {(TOTAL_SPACES - claimedCount).toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-white/50">
            Pixels Left
          </p>
        </div>
      </header>

      {/* CANVAS AREA (Scrollable) */}
      <div className="flex-1 w-full relative overflow-hidden bg-[#1a1a1a]">
        <GridVisual 
          claims={claims} 
          onSelectionChange={setSelection}
        />
        
        {/* Persistent helper text inside the view */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur border border-white/10 rounded-full text-[10px] uppercase tracking-widest font-bold pointer-events-none text-white/60">
          Scroll around. Click & drag to select blocks.
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className={`shrink-0 bg-black border-t border-white/10 p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 ${selectionPixels > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full absolute opacity-0'}`} style={selectionPixels === 0 ? { bottom: 0, width: '100%' } : {}}>
        
        <div className="flex items-center gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50">Selection Area</p>
            <p className="font-mono text-xl font-bold">{selectionPixels.toLocaleString()} px</p>
          </div>
          {selection && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50">Coordinates</p>
              <p className="font-mono text-xs mt-1">X: {selection.x}, Y: {selection.y}</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-white text-black px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-300 transition-colors"
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

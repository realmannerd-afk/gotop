'use client';

import { useState, useEffect } from 'react';
import { getStats, getAllClaims, claimSpace, Space } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claimed, setClaimed] = useState(0);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [successState, setSuccessState] = useState<{id: number, logoUrl: string | null, name: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const stats = await getStats();
      const allSpaces = await getAllClaims();
      setClaimed(stats.claimed);
      setSpaces(allSpaces);
      setLoading(false);
    }
    load();
  }, []);

  const remaining = TOTAL_SPACES - claimed;

  const handleSpaceSelect = (id: number) => {
    setSelectedSpaceId(id);
  };

  const handleGeneralCTAClick = () => {
    // Show instruction to click the grid
    setToastMessage("Drag the map and click an empty space to claim it.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClaimSubmit = async (id: number, name: string, url: string) => {
    setClaiming(true);
    const res = await claimSpace(id, name, url);
    setClaiming(false);
    
    if (res.error) {
      alert(res.error);
      return;
    }
    
    if (res.success && res.id) {
      setSelectedSpaceId(null);
      setClaimed(prev => prev + 1);
      const newClaim: Space = { 
        id: res.id, 
        name, 
        url, 
        logoUrl: res.logoUrl || null, 
        claimedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) 
      };
      setSpaces(current => [...current, newClaim]);
      setSuccessState({ id: res.id, logoUrl: res.logoUrl || null, name });
    }
  };

  if (loading) {
    return <div className="h-screen w-screen bg-[#FAFAFA]" />;
  }

  if (successState) {
    return (
      <main className="relative z-10 flex flex-col items-center justify-center h-screen w-screen bg-[#FAFAFA] p-4 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-[#FF3300] uppercase">
          Your Mark Is Etched.
        </h1>
        <div className="bg-white border border-[#EAEAEA] p-10 max-w-md w-full my-6 flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.03)]">
          <p className="font-mono text-gray-400 mb-6 text-xs">SPACE #{successState.id.toLocaleString()}</p>
          {successState.logoUrl ? (
            <img src={successState.logoUrl} alt="Logo" className="w-16 h-16 mb-6 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-black mb-6" />
          )}
          <p className="text-lg font-bold text-black mb-1">{successState.name}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            Claimed on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex gap-4 w-full max-w-md mt-4">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
              alert("Link copied!");
            }}
            className="flex-1 border border-[#EAEAEA] bg-white text-black font-bold py-4 hover:bg-black hover:text-white transition-colors text-xs uppercase tracking-widest shadow-sm"
          >
            Copy Link
          </button>
          <button 
            onClick={() => window.open(`https://x.com/intent/tweet?text=We%20just%20immortalized%20our%20company%20on%20the%20Internet.%20Space%20%23${successState.id}`, '_blank')}
            className="flex-1 border border-[#EAEAEA] bg-white text-black font-bold py-4 hover:bg-[#1DA1F2] hover:border-transparent hover:text-white transition-colors text-xs uppercase tracking-widest shadow-sm"
          >
            Share
          </button>
        </div>
        
        <button 
          onClick={() => setSuccessState(null)}
          className="mt-12 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-black transition-colors"
        >
          View The Grid
        </button>
      </main>
    );
  }

  return (
    <>
      <GridVisual spaces={spaces} onSpaceSelect={handleSpaceSelect} />
      
      <main className="relative z-10 flex flex-col h-screen w-screen p-6 md:p-12 items-center justify-between pointer-events-none">
        
        {/* HEADER */}
        <div className="text-center w-full mt-4 md:mt-8 pointer-events-auto">
          <div className="inline-block bg-white/80 backdrop-blur-md px-10 py-8 border border-[#EAEAEA] shadow-[0_0_50px_rgba(0,0,0,0.03)]">
            <p className="text-[10px] md:text-xs tracking-[0.2em] text-gray-500 mb-2 font-bold uppercase">
              The internet is running out
            </p>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none text-black">
              {remaining.toLocaleString()}
            </h1>
            <p className="text-xs tracking-[0.2em] text-gray-400 font-bold uppercase mt-4">
              Spaces Left
            </p>
          </div>
        </div>

        {/* TOAST MESSAGE */}
        {toastMessage && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-8 py-4 text-xs font-bold tracking-widest uppercase shadow-2xl animate-in fade-in duration-300">
            {toastMessage}
          </div>
        )}

        {/* FOOTER & CTA */}
        <div className="w-full flex flex-col items-center mb-4 md:mb-8 pointer-events-auto">
          <button 
            onClick={handleGeneralCTAClick}
            className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] hover:scale-105 transition-all duration-300 uppercase tracking-widest text-xs md:text-sm shadow-2xl"
          >
            SELECT A SPACE TO BEGIN
          </button>
          <p className="mt-6 text-[10px] tracking-widest text-gray-500 font-bold uppercase bg-white/80 backdrop-blur-sm px-4 py-2 border border-[#EAEAEA]">
            Drag to pan • Click empty space to claim
          </p>
        </div>

        {selectedSpaceId && (
          <div className="pointer-events-auto">
            <ClaimModal 
              spaceId={selectedSpaceId}
              onClose={() => setSelectedSpaceId(null)} 
              onSubmit={handleClaimSubmit} 
              isSubmitting={claiming}
            />
          </div>
        )}
      </main>
    </>
  );
}

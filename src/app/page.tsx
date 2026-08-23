'use client';

import { useState, useEffect } from 'react';
import { getStats, getAllClaims, claimSpace, Space } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';
import Link from 'next/link';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claimed, setClaimed] = useState(0);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{id: number, logoUrl: string | null} | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

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

  useEffect(() => {
    const timer = setInterval(async () => {
      const stats = await getStats();
      const allSpaces = await getAllClaims();
      setClaimed(stats.claimed);
      setSpaces(allSpaces);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const remaining = TOTAL_SPACES - claimed;

  const handleClaimSubmit = async (name: string, url: string) => {
    setClaiming(true);
    const res = await claimSpace(name, url);
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
        name, 
        url, 
        logoUrl: res.logoUrl || null, 
        claimedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) 
      };
      setSpaces(current => [...current, newClaim]);
      setSuccessState({ id: res.id, logoUrl: res.logoUrl || null });
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA]" />;
  }

  if (successState) {
    return (
      <main className="relative flex-1 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-1000 h-screen w-screen z-10 bg-white/80 backdrop-blur-md">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-[#FF3300]">
          YOUR MARK IS ETCHED.
        </h1>
        <div className="bg-white border border-[#E5E5E5] p-10 max-w-md w-full my-6 shadow-2xl flex flex-col items-center">
          <p className="font-mono text-gray-400 mb-6">SPACE #{successState.id.toLocaleString()}</p>
          {successState.logoUrl ? (
            <img src={successState.logoUrl} alt="Logo" className="w-20 h-20 mb-6 object-contain" />
          ) : (
            <div className="w-20 h-20 bg-black mb-6" />
          )}
          <p className="text-xs text-gray-500">Claimed on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div className="flex gap-4 w-full max-w-md">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
              alert("Link copied!");
            }}
            className="flex-1 border border-[#E5E5E5] bg-white text-black font-bold py-4 hover:bg-black hover:border-black hover:text-white transition-colors text-xs uppercase tracking-widest shadow-sm"
          >
            Copy Link
          </button>
          <button 
            onClick={() => window.open(`https://x.com/intent/tweet?text=I%20just%20immortalized%20my%20company%20on%20the%20Internet.%20Space%20%23${successState.id}`, '_blank')}
            className="flex-1 border border-[#E5E5E5] bg-white text-black font-bold py-4 hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:text-white transition-colors text-xs uppercase tracking-widest shadow-sm"
          >
            Share
          </button>
        </div>
        
        <button 
          onClick={() => setSuccessState(null)}
          className="mt-12 text-xs text-gray-500 hover:text-black transition-colors underline underline-offset-4"
        >
          VIEW THE INTERNET
        </button>
      </main>
    );
  }

  return (
    <>
      <GridVisual total={TOTAL_SPACES} spaces={spaces} />
      
      <main className="relative z-10 flex flex-col h-full w-full pointer-events-none p-4 md:p-8 max-w-[1400px] mx-auto items-center justify-between">
        
        {/* HEADER */}
        <div className="text-center shrink-0 w-full pt-2 md:pt-4">
          <div className="inline-block bg-white/90 backdrop-blur-md px-8 py-6 border border-[#E5E5E5] shadow-sm pointer-events-auto">
            <p className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 mb-2 font-bold uppercase">
              The internet is running out
            </p>
            <h1 className="text-4xl md:text-7xl lg:text-[90px] font-bold tracking-tighter leading-none text-black">
              {remaining.toLocaleString()}
            </h1>
            <p className="text-sm tracking-widest text-gray-400 font-medium uppercase mt-2">
              Spaces Left
            </p>
          </div>
        </div>

        {/* FOOTER & CTA */}
        <div className="shrink-0 w-full flex flex-col items-center pb-2 pointer-events-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] transition-colors duration-300 uppercase tracking-widest text-sm shadow-2xl"
          >
            IMMORTALIZE YOUR COMPANY
          </button>
          
          <p className="mt-4 text-[10px] text-gray-500 tracking-widest uppercase font-bold bg-white/90 px-4 py-1 border border-[#E5E5E5]">
            Drag to pan • Scroll to zoom
          </p>
        </div>

        {isModalOpen && (
          <div className="pointer-events-auto">
            <ClaimModal 
              onClose={() => setIsModalOpen(false)} 
              onSubmit={handleClaimSubmit} 
              isSubmitting={claiming}
            />
          </div>
        )}
      </main>
    </>
  );
}


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
  const [successState, setSuccessState] = useState<{id: number, logoUrl: string | null, name: string} | null>(null);
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
      <GridVisual spaces={spaces} />
      
      <main className="relative z-10 flex flex-col h-screen w-screen p-6 md:p-12 items-center justify-between">
        
        {/* HEADER */}
        <div className="text-center w-full mt-4 md:mt-8">
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

        {/* FOOTER & CTA */}
        <div className="w-full flex flex-col items-center mb-4 md:mb-8">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] hover:scale-105 transition-all duration-300 uppercase tracking-widest text-xs md:text-sm shadow-2xl"
          >
            Immortalize Company
          </button>
        </div>

        {isModalOpen && (
          <ClaimModal 
            onClose={() => setIsModalOpen(false)} 
            onSubmit={handleClaimSubmit} 
            isSubmitting={claiming}
          />
        )}
      </main>
    </>
  );
}

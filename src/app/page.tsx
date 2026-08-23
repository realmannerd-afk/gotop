'use client';

import { useState, useEffect } from 'react';
import { getStats, getAllClaims, claimSpace, Space } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';

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
      <div className="relative min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-black/50 mb-12 uppercase">
          Digital Certificate
        </h2>
        
        <div className="bg-white border border-black/10 p-12 md:p-16 max-w-lg w-full mb-12 shadow-2xl flex flex-col items-center">
          <p className="font-mono text-black/40 mb-10 text-xs uppercase tracking-widest">Space #{successState.id.toLocaleString()}</p>
          
          {successState.logoUrl ? (
            <img src={successState.logoUrl} alt="Logo" className="w-20 h-20 mb-8 object-contain" />
          ) : (
            <div className="w-20 h-20 bg-black mb-8" />
          )}
          
          <h1 className="text-2xl md:text-4xl font-bold text-black tracking-tight mb-2">
            {successState.name}
          </h1>
          <p className="text-[10px] text-black/40 uppercase tracking-widest mt-6">
            Immortalized on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
              alert("Link copied!");
            }}
            className="flex-1 bg-white border border-black/10 text-black font-bold py-5 hover:bg-black hover:text-white transition-colors text-xs uppercase tracking-[0.2em]"
          >
            Copy Link
          </button>
          <button 
            onClick={() => window.open(`https://x.com/intent/tweet?text=We%20just%20immortalized%20our%20company%20on%20the%20Internet.%20Space%20%23${successState.id}`, '_blank')}
            className="flex-1 bg-white border border-black/10 text-black font-bold py-5 hover:bg-[#1DA1F2] hover:border-transparent hover:text-white transition-colors text-xs uppercase tracking-[0.2em]"
          >
            Share
          </button>
        </div>
        
        <button 
          onClick={() => setSuccessState(null)}
          className="mt-16 text-[10px] font-bold tracking-[0.2em] uppercase text-black/40 hover:text-black transition-colors"
        >
          Return
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] flex flex-col selection:bg-black selection:text-white overflow-x-hidden">
      {/* 1M PIXEL CANVAS BACKGROUND */}
      <GridVisual total={TOTAL_SPACES} spaces={spaces} />
      
      <main className="relative z-10 flex-1 flex flex-col items-center justify-between p-6 md:p-12 w-full max-w-5xl mx-auto pointer-events-none min-h-screen">
        
        {/* TOP: THE INTERNET IS RUNNING OUT */}
        <div className="w-full text-center mt-4 md:mt-8">
          <h2 className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-black">
            The Internet Is Running Out
          </h2>
        </div>

        {/* MIDDLE: HOW MUCH IS LEFT? */}
        <div className="flex flex-col items-center justify-center flex-1 w-full py-12">
          <h1 
            className="text-[15vw] md:text-[180px] leading-[0.85] font-bold tracking-tighter text-black tabular-nums"
            style={{ WebkitTextStroke: '1px rgba(0,0,0,0.1)' }}
          >
            {remaining.toLocaleString()}
          </h1>
          <p className="text-xs md:text-sm tracking-[0.3em] font-bold uppercase text-black/50 mt-6 md:mt-8">
            Spaces Left
          </p>
        </div>

        {/* BOTTOM: CAN I CLAIM ONE? */}
        <div className="w-full flex flex-col items-center mb-8 pointer-events-auto">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-12 py-6 text-xs md:text-sm font-bold uppercase tracking-[0.2em] hover:bg-[#FF3300] transition-colors shadow-2xl"
          >
            Claim A Space
          </button>
          
          {spaces.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4 opacity-50 hover:opacity-100 transition-opacity duration-500 w-full max-w-md">
              {spaces.slice(-12).reverse().map(space => (
                <a 
                  key={space.id} 
                  href={space.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  title={space.name}
                  className="w-8 h-8 grayscale hover:grayscale-0 hover:scale-110 transition-all block flex-shrink-0"
                >
                  {space.logoUrl ? (
                    <img src={space.logoUrl} alt={space.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-black" />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* RENDER MODAL OUTSIDE MAIN TO AVOID STACKING / POINTER EVENT ISSUES */}
      {isModalOpen && (
        <ClaimModal 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleClaimSubmit} 
          isSubmitting={claiming}
        />
      )}
    </div>
  );
}

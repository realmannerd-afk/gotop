'use client';

import { useState, useEffect } from 'react';
import { getStats, getAllClaims, claimSpace, Space } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claimed, setClaimed] = useState(0);
  const [claimedIds, setClaimedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{id: number, message: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    async function load() {
      const stats = await getStats();
      const allSpaces = await getAllClaims();
      setClaimed(stats.claimed);
      setClaimedIds(allSpaces.map(s => s.id));
      setLoading(false);
    }
    load();
  }, []);

  const remaining = TOTAL_SPACES - claimed;
  const nextId = claimed + 1; 

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
      setClaimedIds(prev => [...prev, res.id]);
      setSuccessState({ id: res.id, message });
    }
  };

  if (loading) {
    return <div className="h-[100dvh] w-full bg-[#F5F4F0]" />;
  }

  if (successState) {
    return (
      <main className="h-[100dvh] w-full bg-[#F5F4F0] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 selection:bg-black selection:text-[#F5F4F0]">
        <div className="max-w-md w-full flex flex-col items-center">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-black mb-10 uppercase">
            You Got One.
          </h1>
          
          <div className="bg-[#F5F4F0] border border-black p-10 md:p-14 w-full mb-10 relative overflow-hidden">
            <p className="font-mono text-black/40 mb-8 text-[10px] uppercase tracking-widest">Space #{successState.id.toLocaleString()}</p>
            <p className="text-xl md:text-2xl font-medium text-black leading-snug">
              &quot;{successState.message}&quot;
            </p>
          </div>
          
          <div className="w-full flex gap-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
                alert("Link copied!");
              }}
              className="flex-1 border border-black bg-transparent text-black font-bold py-4 hover:bg-black hover:text-[#F5F4F0] transition-colors text-[10px] uppercase tracking-widest"
            >
              Copy Link
            </button>
            <button 
              onClick={() => window.open(`https://x.com/intent/tweet?text=I%20HAVE%20A%20PIECE%20OF%20THE%20INTERNET.%0A%0ASPACE%20%23${successState.id}%0A%0ATHE%20INTERNET%20IS%20RUNNING%20OUT.`, '_blank')}
              className="flex-1 border border-black bg-transparent text-black font-bold py-4 hover:bg-[#1DA1F2] hover:border-transparent hover:text-white transition-colors text-[10px] uppercase tracking-widest"
            >
              Share
            </button>
          </div>
          
          <button 
            onClick={() => setSuccessState(null)}
            className="mt-8 text-[10px] font-bold tracking-widest uppercase text-black/40 hover:text-black transition-colors"
          >
            Return to Grid
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#F5F4F0] flex flex-col selection:bg-black selection:text-[#F5F4F0] text-black overflow-hidden">
      
      {/* HEADER */}
      <div className="shrink-0 w-full text-center pt-8 md:pt-12 px-6">
        <h2 className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-black">
          The Internet Is Running Out.
        </h2>
      </div>

      {/* COUNTER */}
      <div className="shrink-0 flex flex-col items-center justify-center w-full mt-4 md:mt-8 px-6">
        <h1 className="text-[20vw] md:text-[140px] leading-[0.85] font-bold tracking-tighter tabular-nums text-black">
          {remaining.toLocaleString()}
        </h1>
        <p className="text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase mt-4 md:mt-6 text-black/60">
          Spaces Left.
        </p>
      </div>

      {/* GRID */}
      <div className="flex-1 w-full relative border-y border-black/10 mt-6 md:mt-10 min-h-0 bg-[#FAFAF8]">
        <GridVisual total={TOTAL_SPACES} claimedIds={claimedIds} />
      </div>

      {/* CTA FOOTER */}
      <div className="shrink-0 w-full flex flex-col items-center py-6 md:py-8 px-6 bg-[#F5F4F0]">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-[#F5F4F0] px-10 py-5 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] hover:bg-[#FF3300] transition-colors"
        >
          Claim Your Space
        </button>
        <p className="mt-4 text-[9px] md:text-[10px] tracking-[0.2em] font-bold uppercase text-black/40">
          Once it&apos;s gone, it&apos;s gone.
        </p>
      </div>

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

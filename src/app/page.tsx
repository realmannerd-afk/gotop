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
  const [latestClaimStr, setLatestClaimStr] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const stats = await getStats();
      const allSpaces = await getAllClaims();
      setClaimed(stats.claimed);
      setClaimedIds(allSpaces.map(s => s.id));
      if (allSpaces.length > 0) {
        setLatestClaimStr(`Someone just claimed one.`);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Live feeling: poll every 10s
  useEffect(() => {
    if (loading) return;
    const timer = setInterval(async () => {
      const stats = await getStats();
      const allSpaces = await getAllClaims();
      if (stats.claimed > claimed) {
        setLatestClaimStr(`Someone just claimed one.`);
        setTimeout(() => setLatestClaimStr(null), 5000);
      }
      setClaimed(stats.claimed);
      setClaimedIds(allSpaces.map(s => s.id));
    }, 10000);
    return () => clearInterval(timer);
  }, [loading, claimed]);

  const remaining = TOTAL_SPACES - claimed;
  const nextId = claimed + 1; // Simplistic guess for modal display

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
    return <div className="min-h-screen w-full bg-[#F2F1EC]" />;
  }

  if (successState) {
    return (
      <main className="min-h-screen w-full bg-[#F2F1EC] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 selection:bg-black selection:text-[#F2F1EC]">
        <div className="max-w-lg w-full flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-black mb-12">
            YOU GOT ONE.
          </h1>
          
          <div className="bg-[#F2F1EC] border border-black/20 p-12 md:p-16 w-full mb-12 shadow-2xl relative overflow-hidden">
            <p className="font-mono text-black/40 mb-10 text-xs uppercase tracking-widest">Space #{successState.id.toLocaleString()}</p>
            <p className="text-2xl md:text-3xl font-medium text-black leading-snug">
              &quot;{successState.message}&quot;
            </p>
          </div>
          
          <div className="w-full flex flex-col gap-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
                alert("Link copied!");
              }}
              className="w-full border border-black/20 bg-transparent text-black font-bold py-5 hover:bg-black hover:text-[#F2F1EC] transition-colors text-xs uppercase tracking-[0.2em]"
            >
              Copy Link
            </button>
            <button 
              onClick={() => window.open(`https://x.com/intent/tweet?text=I%20HAVE%20A%20PIECE%20OF%20THE%20INTERNET.%0A%0ASPACE%20%23${successState.id}%0A%0ATHE%20INTERNET%20IS%20RUNNING%20OUT.`, '_blank')}
              className="w-full border border-black/20 bg-transparent text-black font-bold py-5 hover:bg-[#1DA1F2] hover:border-transparent hover:text-white transition-colors text-xs uppercase tracking-[0.2em]"
            >
              Share
            </button>
            <button 
              onClick={() => setSuccessState(null)}
              className="w-full bg-black text-[#F2F1EC] font-bold py-5 hover:bg-[#FF3300] transition-colors text-xs uppercase tracking-[0.2em]"
            >
              Done
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F2F1EC] flex flex-col selection:bg-black selection:text-[#F2F1EC] text-black">
      <main className="flex-1 flex flex-col items-center p-6 md:p-12 w-full max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="w-full text-center mt-4">
          <h2 className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">
            The Internet Is Running Out.
          </h2>
        </div>

        {/* COUNTER */}
        <div className="flex flex-col items-center justify-center w-full mt-10 md:mt-16 mb-8 md:mb-12">
          <h1 className="text-[20vw] md:text-[140px] leading-[0.85] font-bold tracking-tighter tabular-nums text-black">
            {remaining.toLocaleString()}
          </h1>
          <p className="text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase mt-6 md:mt-8">
            Spaces Left.
          </p>
        </div>

        {/* GRID */}
        <div className="w-full relative flex flex-col items-center">
          <GridVisual total={TOTAL_SPACES} claimedIds={claimedIds} />
          
          <div className="h-6 mt-4 flex items-center justify-center">
            {latestClaimStr && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-black/50 animate-in fade-in zoom-in duration-500">
                {latestClaimStr}
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="w-full flex flex-col items-center mt-8 md:mt-12 mb-8">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-[#F2F1EC] px-12 py-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] hover:bg-[#FF3300] transition-colors"
          >
            Claim A Space.
          </button>
          <p className="mt-6 text-[10px] tracking-[0.2em] font-bold uppercase text-black/40">
            Once it&apos;s gone, it&apos;s gone.
          </p>
        </div>
      </main>

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

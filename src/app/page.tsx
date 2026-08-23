'use client';

import { useState } from 'react';
import { TOTAL_SPACES, INITIAL_CLAIMED, RECENT_CLAIMS } from '@/lib/mock-data';
import { GridVisual } from '@/components/GridVisual';
import { ClaimModal } from '@/components/ClaimModal';
import Link from 'next/link';

export default function Home() {
  const [claimed, setClaimed] = useState(INITIAL_CLAIMED);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successState, setSuccessState] = useState<{id: number, message: string} | null>(null);

  const remaining = TOTAL_SPACES - claimed;
  const percentage = ((claimed / TOTAL_SPACES) * 100).toFixed(2);
  const nextSpaceId = claimed + 1;

  const handleSuccess = (message: string) => {
    setIsModalOpen(false);
    setClaimed(prev => prev + 1);
    setSuccessState({ id: nextSpaceId, message });
  };

  if (successState) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 min-h-screen">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 text-[#FF3300]">
          YOU HAVE A PIECE<br />OF THE INTERNET.
        </h1>
        <div className="bg-[#111] border border-[#333] p-8 max-w-md w-full my-8">
          <p className="font-mono text-gray-500 mb-4">#{successState.id.toLocaleString()}</p>
          <p className="text-xl md:text-2xl font-medium">&quot;{successState.message}&quot;</p>
          <p className="text-sm text-gray-600 mt-8">Claimed: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/space/${successState.id}`);
              alert("Link copied!");
            }}
            className="flex-1 border border-[#333] bg-transparent text-white font-bold py-4 hover:bg-white hover:text-black transition-colors text-sm uppercase tracking-widest"
          >
            Copy Link
          </button>
          <button 
            onClick={() => window.open(`https://x.com/intent/tweet?text=I%20own%20a%20piece%20of%20the%20Internet.%20Space%20%23${successState.id}`, '_blank')}
            className="flex-1 border border-[#333] bg-transparent text-white font-bold py-4 hover:bg-[#1DA1F2] hover:border-[#1DA1F2] transition-colors text-sm uppercase tracking-widest"
          >
            Share
          </button>
        </div>
        
        <button 
          onClick={() => setSuccessState(null)}
          className="mt-12 text-sm text-gray-500 hover:text-white transition-colors underline underline-offset-4"
        >
          VIEW THE INTERNET
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col px-4 py-12 md:py-24 max-w-5xl mx-auto w-full">
      <div className="text-center mb-16">
        <p className="text-xs md:text-sm tracking-[0.2em] text-gray-400 mb-6 font-medium">
          THE INTERNET IS RUNNING OUT
        </p>
        <h1 className="text-6xl md:text-9xl font-bold tracking-tighter leading-none mb-6">
          {remaining.toLocaleString()}
        </h1>
        <p className="text-lg md:text-xl tracking-widest text-gray-500 font-light">
          SPACES LEFT
        </p>
      </div>

      <div className="mb-16">
        <GridVisual total={TOTAL_SPACES} claimed={claimed} />
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm font-mono text-gray-500 gap-2">
          <div className="flex items-center gap-4">
            <span>{claimed.toLocaleString()} claimed</span>
            <span>{remaining.toLocaleString()} remaining</span>
          </div>
          <div className="text-[#FF3300] font-bold">{percentage}% CLAIMED</div>
        </div>
      </div>

      <div className="flex flex-col items-center mb-24">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black font-bold py-5 px-12 hover:bg-[#FF3300] hover:text-white transition-all duration-300 uppercase tracking-widest text-sm sm:text-base border border-transparent shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,51,0,0.3)]"
        >
          Claim Your Space
        </button>
        <p className="mt-4 text-xs text-gray-600 tracking-widest uppercase">
          Once it&apos;s gone, it&apos;s gone.
        </p>
      </div>

      <div className="border-t border-[#222] pt-12">
        <h3 className="text-xs font-bold tracking-widest text-gray-500 mb-8 uppercase">Recently Claimed</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECENT_CLAIMS.map((space) => (
            <Link href={`/space/${space.id}`} key={space.id} className="block group">
              <div className="bg-[#0A0A0A] border border-[#222] p-6 hover:border-[#FF3300] transition-colors h-full flex flex-col justify-between">
                <p className="text-gray-300 font-medium line-clamp-2 mb-4 group-hover:text-white transition-colors">&quot;{space.message}&quot;</p>
                <p className="text-xs font-mono text-gray-600">#{space.id.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <ClaimModal 
          spaceId={nextSpaceId} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      )}
    </main>
  );
}


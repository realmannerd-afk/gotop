'use client';

import { useState } from 'react';

interface ClaimModalProps {
  spaceId: number | null;
  onClose: () => void;
  onSubmit: (id: number, name: string, url: string) => void;
  isSubmitting: boolean;
}

export function ClaimModal({ spaceId, onClose, onSubmit, isSubmitting }: ClaimModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  
  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !spaceId) return;
    onSubmit(spaceId, name, url);
  };

  if (!spaceId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] w-full max-w-sm p-10 shadow-[0_0_60px_rgba(0,0,0,0.05)] relative">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-5 text-gray-300 hover:text-black transition-colors disabled:opacity-50 text-xl font-light"
        >
          ✕
        </button>
        
        <h2 className="text-sm font-bold tracking-[0.15em] mb-2 text-black text-center uppercase">Reserve Space</h2>
        <p className="text-[10px] text-center text-gray-400 font-mono mb-8 uppercase tracking-widest">#{spaceId.toLocaleString()}</p>
        
        <form onSubmit={handleClaim}>
          <div className="mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder="Company Name"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#EAEAEA] pb-3 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors disabled:opacity-50 text-sm"
              maxLength={80}
              required
            />
          </div>

          <div className="mb-10">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://acme.com"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-[#EAEAEA] pb-3 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors disabled:opacity-50 text-sm"
              required
            />
            <p className="text-[9px] text-gray-400 mt-3 tracking-widest uppercase text-center">Logo is fetched automatically</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !name || !url}
            className="w-full bg-black text-white font-bold py-4 hover:bg-[#FF3300] transition-colors uppercase tracking-[0.2em] text-[10px] disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? 'PROCESSING...' : 'CONFIRM'}
          </button>
        </form>
      </div>
    </div>
  );
}

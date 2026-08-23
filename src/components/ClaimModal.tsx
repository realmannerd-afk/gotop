'use client';

import { useState } from 'react';

interface ClaimModalProps {
  onClose: () => void;
  onSubmit: (name: string, url: string) => void;
  isSubmitting: boolean;
}

export function ClaimModal({ onClose, onSubmit, isSubmitting }: ClaimModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  
  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    onSubmit(name, url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white border border-black/10 w-full max-w-sm p-8 md:p-12 shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-5 text-black/30 hover:text-black transition-colors disabled:opacity-50 text-2xl font-light leading-none"
          aria-label="Close"
        >
          ✕
        </button>
        
        <h2 className="text-xs font-bold tracking-[0.2em] mb-10 text-black text-center uppercase">Claim Your Space</h2>
        
        <form onSubmit={handleClaim} className="flex flex-col gap-6">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-black/40 mb-2 uppercase">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder="Acme Inc."
              disabled={isSubmitting}
              className="w-full bg-[#FAFAFA] border border-black/10 p-4 text-black placeholder-black/30 focus:outline-none focus:border-black transition-colors disabled:opacity-50 text-sm font-medium"
              maxLength={80}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest text-black/40 mb-2 uppercase">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://acme.com"
              disabled={isSubmitting}
              className="w-full bg-[#FAFAFA] border border-black/10 p-4 text-black placeholder-black/30 focus:outline-none focus:border-black transition-colors disabled:opacity-50 text-sm font-medium"
              required
            />
            <p className="text-[10px] text-black/40 mt-3 tracking-widest uppercase text-center">Logo is fetched automatically</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !name || !url}
            className="w-full bg-black text-white font-bold py-5 mt-4 hover:bg-[#FF3300] transition-colors uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </button>
        </form>
      </div>
    </div>
  );
}

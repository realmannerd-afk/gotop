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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/10 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E5] w-full max-w-md p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
        >
          ?
        </button>
        
        <h2 className="text-xl font-bold tracking-tight mb-6 text-black">IMMORTALIZE YOUR COMPANY</h2>
        
        <form onSubmit={handleClaim}>
          <div className="mb-6">
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              placeholder="Acme Inc."
              disabled={isSubmitting}
              className="w-full bg-[#FAFAFA] border border-[#E5E5E5] px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-[#FF3300] transition-colors disabled:opacity-50"
              maxLength={80}
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-xs font-bold tracking-widest text-gray-500 mb-2 uppercase">Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://acme.com"
              disabled={isSubmitting}
              className="w-full bg-[#FAFAFA] border border-[#E5E5E5] px-4 py-3 text-black placeholder-gray-400 focus:outline-none focus:border-[#FF3300] transition-colors disabled:opacity-50"
              required
            />
            <p className="text-[10px] text-gray-400 mt-2">Your company logo will be fetched automatically.</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !name || !url}
            className="w-full bg-black text-white font-bold py-4 px-8 hover:bg-[#FF3300] hover:text-white transition-colors uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'CLAIMING...' : 'CLAIM SPACE'}
          </button>
        </form>
      </div>
    </div>
  );
}

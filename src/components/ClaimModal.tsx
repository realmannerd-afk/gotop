'use client';

import { useState, useRef, useEffect } from 'react';

interface ClaimModalProps {
  pixels: number;
  onClose: () => void;
  onSubmit: (name: string, url: string) => void;
  isSubmitting: boolean;
}

export function ClaimModal({ pixels, onClose, onSubmit, isSubmitting }: ClaimModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !name || !url) return;
    onSubmit(name, url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-black border border-white/20 w-full max-w-sm p-8 md:p-12 shadow-[0_0_50px_rgba(255,255,255,0.05)] relative">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors disabled:opacity-50 text-xl font-light leading-none"
        >
          ✕
        </button>
        
        <h2 className="text-[10px] font-bold tracking-[0.2em] mb-2 text-white/50 text-center uppercase">Claiming</h2>
        <p className="text-3xl font-bold text-center tracking-tighter mb-10 text-white">{pixels.toLocaleString()} Pixels</p>
        
        <form onSubmit={handleClaim} className="flex flex-col gap-6">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Company / Name"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-white/20 pb-3 text-center text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors disabled:opacity-50 text-sm font-medium"
              maxLength={40}
              required
            />
          </div>
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Website URL"
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-white/20 pb-3 text-center text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors disabled:opacity-50 text-sm font-medium"
              required
            />
            <p className="text-[10px] text-white/30 mt-3 text-center font-mono tracking-widest">Logo automatically fetched</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !name || !url}
            className="w-full mt-4 bg-white text-black font-bold py-5 hover:bg-gray-200 transition-colors uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
          >
            {isSubmitting ? 'PROCESSING...' : 'CONFIRM CLAIM'}
          </button>
        </form>
      </div>
    </div>
  );
}

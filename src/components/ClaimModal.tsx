'use client';

import { useState, useRef, useEffect } from 'react';

interface ClaimModalProps {
  spaceId: number;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isSubmitting: boolean;
}

export function ClaimModal({ spaceId, onClose, onSubmit, isSubmitting }: ClaimModalProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !message) return;
    onSubmit(message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAFAFA]/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-black/10 w-full max-w-md p-10 md:p-12 shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-black/30 hover:text-black transition-colors disabled:opacity-50 text-xl font-light leading-none"
        >
          ✕
        </button>
        
        <h2 className="text-xs font-bold tracking-[0.2em] mb-8 text-black text-center uppercase">Claim Your Space</h2>
        
        <p className="text-xs text-center text-black/60 mb-2 uppercase tracking-widest">You are claiming:</p>
        <p className="text-2xl font-bold text-center tracking-tighter mb-10">SPACE #{spaceId.toLocaleString()}</p>
        
        <form onSubmit={handleClaim} className="flex flex-col gap-8">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-black/40 mb-3 uppercase">What do you want to leave behind?</label>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 80))}
              placeholder="Write something..."
              disabled={isSubmitting}
              className="w-full bg-[#FAFAFA] border border-black/10 p-4 text-black placeholder-black/30 focus:outline-none focus:border-black transition-colors disabled:opacity-50 text-sm font-medium"
              maxLength={80}
              required
            />
            <p className="text-[10px] text-black/40 mt-3 text-right font-mono tracking-widest">{message.length}/80</p>
          </div>

          <div>
            <button 
              type="submit"
              disabled={isSubmitting || !message}
              className="w-full bg-black text-white font-bold py-5 hover:bg-[#FF3300] transition-colors uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
            >
              {isSubmitting ? 'PROCESSING...' : 'CLAIM SPACE'}
            </button>
            <p className="text-[9px] text-black/40 mt-3 tracking-widest uppercase text-center">This space cannot be reclaimed.</p>
          </div>
        </form>
      </div>
    </div>
  );
}

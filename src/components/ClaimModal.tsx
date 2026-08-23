'use client';

import { useState, useRef, useEffect } from 'react';

interface ClaimModalProps {
  pixels: number;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isSubmitting: boolean;
}

export function ClaimModal({ pixels, onClose, onSubmit, isSubmitting }: ClaimModalProps) {
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
        
        <form onSubmit={handleClaim} className="flex flex-col gap-8">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 80))}
              placeholder="Leave a message..."
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-white/20 pb-3 text-center text-white placeholder-white/20 focus:outline-none focus:border-white transition-colors disabled:opacity-50 text-lg md:text-xl font-medium"
              maxLength={80}
              required
            />
            <p className="text-[10px] text-white/30 mt-3 text-center font-mono tracking-widest">{message.length}/80</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !message}
            className="w-full bg-white text-black font-bold py-5 hover:bg-gray-200 transition-colors uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
          >
            {isSubmitting ? 'PROCESSING...' : 'CONFIRM CLAIM'}
          </button>
        </form>
      </div>
    </div>
  );
}

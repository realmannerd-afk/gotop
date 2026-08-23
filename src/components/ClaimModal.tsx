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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F5F4F0]/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F5F4F0] border border-black w-full max-w-sm p-8 md:p-12 shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-black/30 hover:text-black transition-colors disabled:opacity-50 text-xl font-light leading-none"
          aria-label="Close"
        >
          ✕
        </button>
        
        <h2 className="text-[10px] font-bold tracking-[0.2em] mb-2 text-black/50 text-center uppercase">Your Space</h2>
        <p className="text-2xl font-bold text-center tracking-tighter mb-10">#{spaceId.toLocaleString()}</p>
        
        <form onSubmit={handleClaim} className="flex flex-col gap-8">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 80))}
              placeholder="Write something..."
              disabled={isSubmitting}
              className="w-full bg-transparent border-b border-black/20 pb-3 text-center text-black placeholder-black/20 focus:outline-none focus:border-black transition-colors disabled:opacity-50 text-lg md:text-xl font-medium"
              maxLength={80}
              required
            />
            <p className="text-[10px] text-black/30 mt-3 text-center font-mono tracking-widest">{message.length}/80</p>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !message}
            className="w-full bg-black text-[#F5F4F0] font-bold py-5 hover:bg-[#FF3300] transition-colors uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
          >
            {isSubmitting ? 'PROCESSING...' : 'CLAIM IT'}
          </button>
        </form>
      </div>
    </div>
  );
}

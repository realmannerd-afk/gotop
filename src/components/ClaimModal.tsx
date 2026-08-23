'use client';

import { useState } from 'react';

interface ClaimModalProps {
  onClose: () => void;
  onSubmit: (message: string) => void;
  isSubmitting: boolean;
}

export function ClaimModal({ onClose, onSubmit, isSubmitting }: ClaimModalProps) {
  const [message, setMessage] = useState('');
  
  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    onSubmit(message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5E5E5] w-full max-w-md p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors disabled:opacity-50"
        >
          ?
        </button>
        
        <h2 className="text-xl font-bold tracking-tight mb-6 text-black">CLAIM YOUR SPACE</h2>
        
        <form onSubmit={handleClaim}>
          <div className="mb-8">
            <label className="block text-sm text-gray-500 mb-2">What do you want to leave behind?</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 80))}
              placeholder="I was here."
              disabled={isSubmitting}
              className="w-full bg-[#FAFAFA] border border-[#E5E5E5] p-4 text-black placeholder-gray-400 focus:outline-none focus:border-[#FF3300] transition-colors resize-none h-24 disabled:opacity-50"
              maxLength={80}
              required
            />
            <div className="text-right text-xs text-gray-400 mt-2 font-mono">
              {message.length} / 80
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting || !message}
            className="w-full bg-black text-white font-bold py-4 px-8 hover:bg-[#FF3300] hover:text-white transition-colors uppercase tracking-widest text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'CLAIMING...' : 'CLAIM SPACE'}
          </button>
          <p className="text-center text-xs text-gray-400 mt-4">
            This space cannot be reclaimed.
          </p>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface ClaimModalProps {
  spaceId: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function ClaimModal({ spaceId, onClose, onSuccess }: ClaimModalProps) {
  const [message, setMessage] = useState('');
  
  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#333] w-full max-w-md p-8 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          ?
        </button>
        
        <h2 className="text-xl font-bold tracking-tight mb-6">CLAIM YOUR SPACE</h2>
        
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-1">You are claiming:</p>
          <p className="text-2xl font-mono text-[#FF3300]">SPACE #{spaceId.toLocaleString()}</p>
        </div>

        <form onSubmit={handleClaim}>
          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-2">What do you want to leave behind?</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 80))}
              placeholder="I was here."
              className="w-full bg-[#111] border border-[#333] p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF3300] transition-colors resize-none h-24"
              maxLength={80}
              required
            />
            <div className="text-right text-xs text-gray-500 mt-2 font-mono">
              {message.length} / 80
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-black font-bold py-4 px-8 hover:bg-[#FF3300] hover:text-white transition-colors uppercase tracking-widest text-sm"
          >
            Claim Space
          </button>
          <p className="text-center text-xs text-gray-500 mt-4">
            This space cannot be reclaimed.
          </p>
        </form>
      </div>
    </div>
  );
}

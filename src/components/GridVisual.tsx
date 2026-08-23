'use client';

import { useEffect, useRef } from 'react';

interface GridVisualProps {
  total: number;
  claimed: number;
}

export function GridVisual({ total, claimed }: GridVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // We have 1,000,000 spaces. A 100x100 grid = 10,000 cells.
    // Each cell represents 100 spaces.
    const columns = 100;
    const rows = 100;
    const cellsClaimed = Math.floor(claimed / (total / (columns * rows)));

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const cellW = rect.width / columns;
    const cellH = rect.height / rows;

    // Draw background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const gap = 1;

    for (let i = 0; i < rows * columns; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const x = col * cellW;
      const y = row * cellH;

      if (i < cellsClaimed) {
        ctx.fillStyle = '#FF3300'; // Accent color for claimed
      } else {
        ctx.fillStyle = '#1A1A1A'; // Empty state
      }

      ctx.fillRect(x + gap, y + gap, cellW - gap * 2, cellH - gap * 2);
    }
  }, [total, claimed]);

  return (
    <div className="w-full aspect-square max-w-[600px] mx-auto opacity-90 hover:opacity-100 transition-opacity">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block rounded-sm border border-[#222]" 
      />
    </div>
  );
}

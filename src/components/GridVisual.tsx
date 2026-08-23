'use client';

import { useEffect, useRef } from 'react';
import { Space } from '@/app/actions';

export function GridVisual({ total, spaces }: { total: number; spaces: Space[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // 1,000,000 spaces = 1000x1000 grid
    const SIDE = Math.ceil(Math.sqrt(total));
    canvas.width = SIDE;
    canvas.height = SIDE;

    const imgData = ctx.createImageData(SIDE, SIDE);
    const data = imgData.data;

    // Fill entirely with a very subtle off-white/gray (#F0F0F0)
    for (let i = 0; i < total * 4; i += 4) {
      data[i] = 240;
      data[i + 1] = 240;
      data[i + 2] = 240;
      data[i + 3] = 255;
    }

    // Turn claimed spaces pure black
    spaces.forEach(space => {
      // id is 1-indexed
      const pixelIndex = (space.id - 1) * 4;
      if (pixelIndex < data.length) {
        data[pixelIndex] = 0;
        data[pixelIndex + 1] = 0;
        data[pixelIndex + 2] = 0;
        data[pixelIndex + 3] = 255;
      }
    });

    ctx.putImageData(imgData, 0, 0);
  }, [total, spaces]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply">
      <canvas 
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

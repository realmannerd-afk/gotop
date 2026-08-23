'use client';

import { useEffect, useRef, useState } from 'react';

interface GridVisualProps {
  total: number;
  claimedIds: number[];
}

export function GridVisual({ total, claimedIds }: GridVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastClaimed, setLastClaimed] = useState(claimedIds.length);
  const pulseRef = useRef<{ id: number, start: number } | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (claimedIds.length > lastClaimed) {
      setLastClaimed(claimedIds.length);
      // Get the highest ID claimed
      const maxId = Math.max(...claimedIds);
      pulseRef.current = { id: maxId, start: performance.now() };
    }
  }, [claimedIds.length, lastClaimed, claimedIds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const SIDE = Math.ceil(Math.sqrt(total)); // 1000
    canvas.width = SIDE;
    canvas.height = SIDE;

    const imgData = ctx.createImageData(SIDE, SIDE);
    const data = imgData.data;

    const render = (time: number) => {
      // Background: Warm off-white #F2F1EC -> R:242, G:241, B:236
      for (let i = 0; i < total * 4; i += 4) {
        data[i] = 242;
        data[i + 1] = 241;
        data[i + 2] = 236;
        data[i + 3] = 255;
      }

      // Claimed spaces: Black
      for (let i = 0; i < claimedIds.length; i++) {
        const id = claimedIds[i];
        const pixelIndex = (id - 1) * 4;
        if (pixelIndex < data.length) {
          data[pixelIndex] = 0;
          data[pixelIndex + 1] = 0;
          data[pixelIndex + 2] = 0;
          data[pixelIndex + 3] = 255;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Draw pulse
      if (pulseRef.current) {
        const elapsed = time - pulseRef.current.start;
        const duration = 2000;
        
        if (elapsed < duration) {
          const index = pulseRef.current.id - 1;
          const px = index % SIDE;
          const py = Math.floor(index / SIDE);
          
          const progress = elapsed / duration;
          const radius = 1 + (progress * 10);
          const alpha = 1 - progress;

          ctx.strokeStyle = `rgba(255, 51, 0, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          pulseRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [total, claimedIds]);

  return (
    <div className="w-full max-w-[600px] aspect-square mx-auto border border-black/10 shadow-2xl bg-[#F2F1EC] p-2 md:p-4">
      <canvas 
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

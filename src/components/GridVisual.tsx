'use client';

import { useEffect, useRef } from 'react';

interface GridVisualProps {
  total: number;
  claimed: number;
}

export function GridVisual({ total, claimed }: GridVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastClaimedRef = useRef<number>(claimed);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  if (claimed > lastClaimedRef.current) {
    lastClaimedRef.current = claimed;
    startTimeRef.current = performance.now();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // 1000 x 1000 = 1,000,000 pixels
    const width = 1000;
    const height = 1000;
    
    // Set internal resolution strictly to 1000x1000
    canvas.width = width;
    canvas.height = height;

    // Create ImageData once or reuse
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // We will render this in an animation loop to handle the pulse
    const render = (time: number) => {
      // 1. Draw base grid
      for (let i = 0; i < total; i++) {
        const offset = i * 4;
        if (i < claimed) {
          // Claimed space: Pitch Black
          data[offset] = 0;
          data[offset+1] = 0;
          data[offset+2] = 0;
          data[offset+3] = 255;
        } else {
          // Empty space: Light Gray (#EBEBEB = 235)
          data[offset] = 235;
          data[offset+1] = 235;
          data[offset+2] = 235;
          data[offset+3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);

      // 2. Draw Highlight Pulse
      // If a new claim happened recently, draw a pulsing red box around it
      if (startTimeRef.current > 0) {
        const elapsed = time - startTimeRef.current;
        const duration = 2000; // 2 seconds
        
        if (elapsed < duration) {
          const highlightIndex = claimed - 1;
          const hx = highlightIndex % width;
          const hy = Math.floor(highlightIndex / width);
          
          // Subtle pulse math
          const progress = elapsed / duration;
          // ease out sine
          const alpha = Math.max(0, 1 - Math.sin((progress * Math.PI) / 2));
          const size = 1 + (progress * 15); // expands from 1 to 15 pixels

          ctx.fillStyle = `rgba(255, 51, 0, ${alpha})`;
          ctx.beginPath();
          ctx.arc(hx, hy, size, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationRef.current);
  }, [total, claimed]);

  return (
    <div className="w-full relative group shadow-[0_0_50px_rgba(0,0,0,0.05)] border border-[#E5E5E5] bg-white">
      {/* 
        Force aspect ratio and make it massive. 
        Using crisp-edges / pixelated in CSS ensures 1px = 1 space is perfectly crisp.
      */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-auto aspect-square block cursor-crosshair" 
      />
      <div className="absolute inset-0 border border-black/5 pointer-events-none" />
    </div>
  );
}


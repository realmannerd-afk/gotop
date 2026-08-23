'use client';

import { useEffect, useRef, useState } from 'react';
import { Claim } from '@/app/actions';

interface GridVisualProps {
  claims: Claim[];
  onSelectionChange: (rect: { x: number, y: number, w: number, h: number } | null) => void;
}

export function GridVisual({ claims, onSelectionChange }: GridVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

  const [renderTick, setRenderTick] = useState(0);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  const SIDE = 1000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = SIDE;
    canvas.height = SIDE;

    // Fill background (black canvas)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, SIDE, SIDE);

    // Draw subtle grid (every 10px = 1 block)
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= SIDE; i += 10) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, SIDE);
      ctx.moveTo(0, i);
      ctx.lineTo(SIDE, i);
    }
    ctx.stroke();

    // Draw claims
    claims.forEach(claim => {
      // White background for the claimed pixels
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(claim.x, claim.y, claim.w, claim.h);

      if (!imageCache.current[claim.logoUrl]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = claim.logoUrl;
        img.onload = () => setRenderTick(t => t + 1);
        imageCache.current[claim.logoUrl] = img;
      } else if (imageCache.current[claim.logoUrl].complete) {
        ctx.drawImage(imageCache.current[claim.logoUrl], claim.x, claim.y, claim.w, claim.h);
      }
    });
  }, [claims, renderTick]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    
    // In a fixed 1000x1000 element, native event offsetX/Y is perfect
    const cx = Math.round(e.nativeEvent.offsetX);
    const cy = Math.round(e.nativeEvent.offsetY);

    // Snap to 10x10 grid (optional, but standard for 1millionpixels)
    const snapX = Math.floor(cx / 10) * 10;
    const snapY = Math.floor(cy / 10) * 10;

    setIsDragging(true);
    setStartPos({ x: snapX, y: snapY });
    setCurrentPos({ x: snapX, y: snapY });
    onSelectionChange(null);
    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const cx = Math.max(0, Math.min(Math.round(e.nativeEvent.offsetX), SIDE));
    const cy = Math.max(0, Math.min(Math.round(e.nativeEvent.offsetY), SIDE));

    // Snap to 10x10 grid
    const snapX = Math.ceil(cx / 10) * 10;
    const snapY = Math.ceil(cy / 10) * 10;

    setCurrentPos({ x: snapX, y: snapY });

    const x = Math.min(startPos.x, snapX);
    const y = Math.min(startPos.y, snapY);
    const w = Math.abs(snapX - startPos.x);
    const h = Math.abs(snapY - startPos.y);

    if (w > 0 && h > 0) {
      onSelectionChange({ x, y, w, h });
    } else {
      onSelectionChange(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const selX = Math.min(startPos.x, currentPos.x);
  const selY = Math.min(startPos.y, currentPos.y);
  const selW = Math.abs(currentPos.x - startPos.x);
  const selH = Math.abs(currentPos.y - startPos.y);

  return (
    <div className="w-full h-full overflow-auto bg-[#1a1a1a] flex items-start justify-center p-8 custom-scrollbar">
      {/* FIXED 1000x1000 Container */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative shadow-[0_0_100px_rgba(255,255,255,0.1)] border border-white/20 touch-none flex-shrink-0 cursor-crosshair"
        style={{ width: SIDE, height: SIDE }}
      >
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Selection Overlay */}
        {isDragging && selW > 0 && selH > 0 && (
          <div 
            className="absolute border-2 border-white bg-white/30 mix-blend-difference pointer-events-none"
            style={{
              left: selX,
              top: selY,
              width: selW,
              height: selH
            }}
          />
        )}
      </div>
    </div>
  );
}

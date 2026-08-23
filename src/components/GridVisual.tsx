'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Claim } from '@/app/actions';

interface GridVisualProps {
  claims: Claim[];
  mode: 'pan' | 'select';
  onSelectionChange: (rect: { x: number, y: number, w: number, h: number } | null) => void;
}

export function GridVisual({ claims, mode, onSelectionChange }: GridVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Viewport transforms
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  
  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });

  // Image cache
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const [renderTick, setRenderTick] = useState(0);

  const SIDE = 1000; // 1,000,000 pixels = 1000x1000

  // Handle rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = SIDE;
    canvas.height = SIDE;

    // Fill background (unclaimed)
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, SIDE, SIDE);

    // Draw grid lines (very subtle)
    ctx.strokeStyle = '#222222';
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
      // Draw white background for claimed block
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(claim.x, claim.y, claim.w, claim.h);

      // Draw logo
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
    setIsDragging(true);
    containerRef.current.setPointerCapture(e.pointerId);

    if (mode === 'pan') {
      setLastPan({ x: e.clientX, y: e.clientY });
    } else {
      // Calculate exact internal canvas coordinates
      const rect = canvasRef.current!.getBoundingClientRect();
      // offsetX/Y on the canvas event is reliable, but PointerEvent is attached to container.
      // So we map clientX to the canvas rect.
      let cx = (e.clientX - rect.left) / scale;
      let cy = (e.clientY - rect.top) / scale;
      cx = Math.max(0, Math.min(Math.round(cx), SIDE));
      cy = Math.max(0, Math.min(Math.round(cy), SIDE));

      setStartPos({ x: cx, y: cy });
      setCurrentPos({ x: cx, y: cy });
      onSelectionChange(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    if (mode === 'pan') {
      const dx = e.clientX - lastPan.x;
      const dy = e.clientY - lastPan.y;
      setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPan({ x: e.clientX, y: e.clientY });
    } else {
      const rect = canvasRef.current!.getBoundingClientRect();
      let cx = (e.clientX - rect.left) / scale;
      let cy = (e.clientY - rect.top) / scale;
      cx = Math.max(0, Math.min(Math.round(cx), SIDE));
      cy = Math.max(0, Math.min(Math.round(cy), SIDE));
      
      setCurrentPos({ x: cx, y: cy });

      const x = Math.min(startPos.x, cx);
      const y = Math.min(startPos.y, cy);
      const w = Math.abs(cx - startPos.x);
      const h = Math.abs(cy - startPos.y);

      if (w > 0 && h > 0) {
        onSelectionChange({ x, y, w, h });
      } else {
        onSelectionChange(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.002;
    const delta = -e.deltaY * zoomSensitivity;
    
    // Zoom around cursor
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    // Center point relative to container center
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;
    
    const newScale = Math.max(0.2, Math.min(scale * (1 + delta), 20)); // min 0.2x, max 20x
    const scaleRatio = newScale / scale;
    
    // Adjust translation so cursor stays in same physical spot
    const newTx = mouseX - (mouseX - translate.x - cx) * scaleRatio - cx;
    const newTy = mouseY - (mouseY - translate.y - cy) * scaleRatio - cy;
    
    setScale(newScale);
    setTranslate({ x: newTx, y: newTy });
  };

  const selX = Math.min(startPos.x, currentPos.x);
  const selY = Math.min(startPos.y, currentPos.y);
  const selW = Math.abs(currentPos.x - startPos.x);
  const selH = Math.abs(currentPos.y - startPos.y);

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden touch-none border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] ${mode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
    >
      <div 
        className="absolute top-1/2 left-1/2 origin-top-left"
        style={{
          transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
          width: SIDE,
          height: SIDE,
        }}
      >
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Selection Overlay */}
        {mode === 'select' && isDragging && selW > 0 && selH > 0 && (
          <div 
            className="absolute border border-white bg-white/20 mix-blend-difference pointer-events-none"
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

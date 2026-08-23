'use client';

import { useEffect, useRef, useState } from 'react';
import { Claim } from '@/app/actions';

interface GridVisualProps {
  claims: Claim[];
  onBlockClick: (x: number, y: number, w: number, h: number) => void;
  onClaimClick: (claim: Claim) => void;
}

export function GridVisual({ claims, onBlockClick, onClaimClick }: GridVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [didPan, setDidPan] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, rawX: 0, rawY: 0 });
  const [hoveredClaim, setHoveredClaim] = useState<Claim | null>(null);
  const [hoveredEmpty, setHoveredEmpty] = useState<{x: number, y: number} | null>(null);
  const [isClient, setIsClient] = useState(false);

  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const [renderTick, setRenderTick] = useState(0);

  const SIDE = 1000;
  const BLOCK_SIZE = 10;
  
  const GOLD_START = 400;
  const GOLD_END = 600;
  const isGold = (x: number, y: number) => x >= GOLD_START && x < GOLD_END && y >= GOLD_START && y < GOLD_END;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = SIDE;
    canvas.height = SIDE;

    // Background Normal
    ctx.fillStyle = '#FAFAF9';
    ctx.fillRect(0, 0, SIDE, SIDE);

    // Background Gold Zone
    ctx.fillStyle = '#FCF9F0'; 
    ctx.fillRect(GOLD_START, GOLD_START, GOLD_END - GOLD_START, GOLD_END - GOLD_START);

    // Normal Grid lines
    ctx.beginPath();
    for (let i = 0; i <= SIDE; i += BLOCK_SIZE) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, SIDE);
      ctx.moveTo(0, i);
      ctx.lineTo(SIDE, i);
    }
    ctx.strokeStyle = '#E5E5E5';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Gold Grid lines
    ctx.beginPath();
    for (let i = GOLD_START; i <= GOLD_END; i += BLOCK_SIZE) {
      ctx.moveTo(i, GOLD_START);
      ctx.lineTo(i, GOLD_END);
      ctx.moveTo(GOLD_START, i);
      ctx.lineTo(GOLD_END, i);
    }
    ctx.strokeStyle = '#EADCA6';
    ctx.stroke();

    // Draw Claims
    claims.forEach(claim => {
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
    setIsDragging(true);
    setDidPan(false);
    setStartPan({ x: e.clientX, y: e.clientY });
    setLastPan({ x: e.clientX, y: e.clientY });
    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;

    if (isDragging) {
      const dx = e.clientX - lastPan.x;
      const dy = e.clientY - lastPan.y;
      setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPan({ x: e.clientX, y: e.clientY });
      
      if (Math.abs(e.clientX - startPan.x) > 5 || Math.abs(e.clientY - startPan.y) > 5) {
        setDidPan(true);
      }
    }

    const rect = canvasRef.current!.getBoundingClientRect();
    let cx = (e.clientX - rect.left) / scale;
    let cy = (e.clientY - rect.top) / scale;
    
    setMousePos({ x: cx, y: cy, rawX: e.clientX, rawY: e.clientY });

    if (cx >= 0 && cx <= SIDE && cy >= 0 && cy <= SIDE) {
      const claim = claims.find(c => cx >= c.x && cx < c.x + c.w && cy >= c.y && cy < c.y + c.h);
      if (claim) {
        setHoveredClaim(claim);
        setHoveredEmpty(null);
      } else {
        setHoveredClaim(null);
        setHoveredEmpty({
          x: Math.floor(cx / BLOCK_SIZE) * BLOCK_SIZE,
          y: Math.floor(cy / BLOCK_SIZE) * BLOCK_SIZE
        });
      }
    } else {
      setHoveredClaim(null);
      setHoveredEmpty(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);

    // If we panned significantly, don't trigger click
    if (Math.abs(e.clientX - startPan.x) <= 5 && Math.abs(e.clientY - startPan.y) <= 5) {
      if (hoveredClaim) {
        onClaimClick(hoveredClaim);
      } else if (hoveredEmpty) {
        onBlockClick(hoveredEmpty.x, hoveredEmpty.y, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const zoomSensitivity = 0.002;
    const delta = -e.deltaY * zoomSensitivity;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    const cx = containerRect.width / 2;
    const cy = containerRect.height / 2;
    
    const newScale = Math.max(0.5, Math.min(scale * (1 + delta), 10));
    const scaleRatio = newScale / scale;
    
    const newTx = mouseX - (mouseX - translate.x - cx) * scaleRatio - cx;
    const newTy = mouseY - (mouseY - translate.y - cy) * scaleRatio - cy;
    
    setScale(newScale);
    setTranslate({ x: newTx, y: newTy });
  };

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden touch-none bg-[#FAFAF9]"
    >
      <div 
        className="absolute top-1/2 left-1/2 origin-top-left transition-transform duration-75"
        style={{
          transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px)) scale(${scale})`,
          width: SIDE,
          height: SIDE,
        }}
      >
        <canvas 
          ref={canvasRef}
          className="w-full h-full shadow-sm"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {hoveredClaim && (
          <div 
            className="absolute border border-[#111111] pointer-events-none transition-all duration-75"
            style={{
              left: hoveredClaim.x - 1,
              top: hoveredClaim.y - 1,
              width: hoveredClaim.w + 2,
              height: hoveredClaim.h + 2,
            }}
          />
        )}

        {hoveredEmpty && !hoveredClaim && (
          <div 
            className="absolute bg-[#111111]/10 border border-[#111111]/30 pointer-events-none transition-all duration-75"
            style={{
              left: hoveredEmpty.x,
              top: hoveredEmpty.y,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
            }}
          />
        )}
      </div>

      {isClient && hoveredClaim && !isDragging && (
        <div 
          className="fixed pointer-events-none z-50 bg-white border border-[#E5E5E5] text-[#111111] px-3 py-2 text-[10px] uppercase font-bold tracking-widest shadow-sm"
          style={{ left: mousePos.rawX + 15, top: mousePos.rawY + 15 }}
        >
          {hoveredClaim.name}
        </div>
      )}

      {isClient && hoveredEmpty && !isDragging && (
        <div 
          className="fixed pointer-events-none z-50 bg-white border border-[#E5E5E5] text-[#111111] px-3 py-2 text-[10px] uppercase font-bold tracking-widest shadow-sm flex flex-col gap-1"
          style={{ left: mousePos.rawX + 15, top: mousePos.rawY + 15 }}
        >
          <span className={isGold(hoveredEmpty.x, hoveredEmpty.y) ? "text-[#D4AF37]" : ""}>
            {isGold(hoveredEmpty.x, hoveredEmpty.y) ? "Gold Space" : "Available"}
          </span>
          <span className={isGold(hoveredEmpty.x, hoveredEmpty.y) ? "text-[#D4AF37]" : "text-[#737373]"}>
            ${isGold(hoveredEmpty.x, hoveredEmpty.y) ? "500" : "10"}
          </span>
          <span className="mt-1 border-t border-[#E5E5E5] pt-1 text-center">Click to Buy</span>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-20 flex bg-white border border-[#E5E5E5] shadow-sm overflow-hidden text-[#111111] font-mono text-sm">
        <button onClick={() => setScale(s => Math.min(s * 1.2, 10))} className="px-3 py-2 hover:bg-[#FAFAF9] border-r border-[#E5E5E5] transition-colors">+</button>
        <button onClick={() => setScale(s => Math.max(s / 1.2, 0.5))} className="px-3 py-2 hover:bg-[#FAFAF9] border-r border-[#E5E5E5] transition-colors">-</button>
        <button onClick={() => { setScale(1); setTranslate({x: 0, y: 0}); }} className="px-3 py-2 hover:bg-[#FAFAF9] text-[10px] uppercase tracking-widest font-bold transition-colors">Reset</button>
      </div>
    </div>
  );
}

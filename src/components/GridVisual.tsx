'use client';

import { useEffect, useRef, useState } from 'react';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface GridVisualProps {
  total: number;
  claimedIds: number[];
  onSelectionChange: (pixels: number) => void;
}

export function GridVisual({ total, claimedIds, onSelectionChange }: GridVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  
  const SIDE = Math.ceil(Math.sqrt(total)); // 1000

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    canvas.width = SIDE;
    canvas.height = SIDE;

    const imgData = ctx.createImageData(SIDE, SIDE);
    const data = imgData.data;

    // Unclaimed: dark gray (#111111)
    for (let i = 0; i < total * 4; i += 4) {
      data[i] = 17;
      data[i + 1] = 17;
      data[i + 2] = 17;
      data[i + 3] = 255;
    }

    // Claimed: white (#FFFFFF)
    for (let i = 0; i < claimedIds.length; i++) {
      const id = claimedIds[i];
      const pixelIndex = (id - 1) * 4;
      if (pixelIndex < data.length) {
        data[pixelIndex] = 255;
        data[pixelIndex + 1] = 255;
        data[pixelIndex + 2] = 255;
        data[pixelIndex + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [total, claimedIds, SIDE]);

  // Pointer Handlers for Selection
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SIDE;
    const y = ((e.clientY - rect.top) / rect.height) * SIDE;
    
    setIsDragging(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    onSelectionChange(0);
    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Clamp coordinates to canvas bounds
    let x = ((e.clientX - rect.left) / rect.width) * SIDE;
    let y = ((e.clientY - rect.top) / rect.height) * SIDE;
    x = Math.max(0, Math.min(x, SIDE));
    y = Math.max(0, Math.min(y, SIDE));
    
    setCurrentPos({ x, y });
    
    const w = Math.abs(x - startPos.x);
    const h = Math.abs(y - startPos.y);
    const pixels = Math.round(w) * Math.round(h);
    onSelectionChange(pixels);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  // Calculate selection box style in percentages
  const selLeft = Math.min(startPos.x, currentPos.x) / SIDE * 100;
  const selTop = Math.min(startPos.y, currentPos.y) / SIDE * 100;
  const selWidth = Math.abs(currentPos.x - startPos.x) / SIDE * 100;
  const selHeight = Math.abs(currentPos.y - startPos.y) / SIDE * 100;

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full max-w-[80vh] aspect-square mx-auto cursor-crosshair touch-none shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/10"
    >
      <canvas 
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Selection Box Overlay */}
      {isDragging && selWidth > 0 && selHeight > 0 && (
        <div 
          className="absolute border border-white bg-white/20 mix-blend-difference pointer-events-none"
          style={{
            left: `${selLeft}%`,
            top: `${selTop}%`,
            width: `${selWidth}%`,
            height: `${selHeight}%`
          }}
        />
      )}
    </div>
  );
}

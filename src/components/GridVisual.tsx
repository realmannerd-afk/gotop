'use client';

import { useEffect, useRef, useState } from 'react';
import { Space } from '@/app/actions';

interface GridVisualProps {
  spaces: Space[];
  total: number;
}

export function GridVisual({ spaces, total }: GridVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Pan and zoom state
  const offsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1); // 1 = 20px per cell

  const CELL_SIZE = 20;
  const COLS = 1000;
  const ROWS = 1000;

  // Image cache
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());

  useEffect(() => {
    // Preload missing images
    spaces.forEach(space => {
      if (space.logoUrl && !imagesRef.current.has(space.id)) {
        const img = new Image();
        img.src = space.logoUrl;
        img.crossOrigin = "anonymous";
        imagesRef.current.set(space.id, img);
      }
    });
  }, [spaces]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Center the grid initially if first load (roughly around claim #1)
      if (offsetRef.current.x === 0 && offsetRef.current.y === 0) {
         offsetRef.current.x = (window.innerWidth / 2) - (CELL_SIZE / 2);
         offsetRef.current.y = (window.innerHeight / 2) - (CELL_SIZE / 2);
      }
    };
    window.addEventListener('resize', resize);
    resize();

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const scale = scaleRef.current;
      const currentCellSize = CELL_SIZE * scale;
      const ox = offsetRef.current.x;
      const oy = offsetRef.current.y;

      // Clear bg
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, width, height);

      // Determine visible range
      const startCol = Math.max(0, Math.floor(-ox / currentCellSize));
      const endCol = Math.min(COLS, Math.ceil((width - ox) / currentCellSize));
      const startRow = Math.max(0, Math.floor(-oy / currentCellSize));
      const endRow = Math.min(ROWS, Math.ceil((height - oy) / currentCellSize));

      // Draw grid lines
      ctx.strokeStyle = '#EBEBEB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = startCol; c <= endCol; c++) {
        const x = ox + c * currentCellSize;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let r = startRow; r <= endRow; r++) {
        const y = oy + r * currentCellSize;
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw claimed spaces
      // Instead of looping all spaces, we can quickly filter which are visible
      // because id = row * COLS + col + 1
      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          const spaceId = r * COLS + c + 1;
          // Find space (this could be optimized with a Map, but fine for MVP array < 10k)
          const space = spaces.find(s => s.id === spaceId);
          
          if (space) {
            const x = ox + c * currentCellSize;
            const y = oy + r * currentCellSize;
            
            // Draw background block
            ctx.fillStyle = '#111111';
            ctx.fillRect(x, y, currentCellSize, currentCellSize);

            // Draw image if loaded
            const img = imagesRef.current.get(spaceId);
            if (img && img.complete) {
              // Draw with 2px padding
              const padding = 2 * scale;
              ctx.drawImage(img, x + padding, y + padding, currentCellSize - padding*2, currentCellSize - padding*2);
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [spaces]);

  // Event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    offsetRef.current.x += dx;
    offsetRef.current.y += dy;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    let newScale = scaleRef.current - e.deltaY * zoomSensitivity;
    newScale = Math.max(0.5, Math.min(newScale, 5)); // min 0.5x, max 5x zoom
    
    // Zoom around mouse
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const wx = (mouseX - offsetRef.current.x) / scaleRef.current;
      const wy = (mouseY - offsetRef.current.y) / scaleRef.current;
      
      offsetRef.current.x = mouseX - wx * newScale;
      offsetRef.current.y = mouseY - wy * newScale;
    }

    scaleRef.current = newScale;
  };

  // We add touch-action: none to allow our custom pointer events to override browser scrolling
  return (
    <div className="fixed inset-0 z-0">
      <canvas 
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="block cursor-grab active:cursor-grabbing touch-none"
        style={{ width: '100vw', height: '100vh', imageRendering: 'pixelated' }}
      />
    </div>
  );
}

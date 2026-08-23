'use client';

import { useState, useRef, useEffect } from 'react';
import { Space } from '@/app/actions';

interface GridVisualProps {
  spaces: Space[];
  onSpaceSelect: (id: number) => void;
}

export function GridVisual({ spaces, onSpaceSelect }: GridVisualProps) {
  const CELL_SIZE = 32; 
  const COLS = 1000;
  const ROWS = 1000;
  const WIDTH = COLS * CELL_SIZE;
  const HEIGHT = ROWS * CELL_SIZE;

  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const dragHasMoved = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Center the camera initially
  useEffect(() => {
    setPos({
      x: -(WIDTH / 2) + window.innerWidth / 2,
      y: -(HEIGHT / 2) + window.innerHeight / 2
    });
    setMounted(true);
  }, [WIDTH, HEIGHT]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragHasMoved.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragHasMoved.current = true;
    }
    
    setPos(p => ({ x: p.x + dx, y: p.y + dy }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragHasMoved.current) return; // Prevent click if user was just panning

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const col = Math.floor(offsetX / CELL_SIZE);
    const row = Math.floor(offsetY / CELL_SIZE);
    
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const spaceId = row * COLS + col + 1;
      const isClaimed = spaces.some(s => s.id === spaceId);
      
      if (!isClaimed) {
         onSpaceSelect(spaceId);
      } else {
         const space = spaces.find(s => s.id === spaceId);
         if (space?.url) window.open(space.url, '_blank');
      }
    }
  };

  if (!mounted) return <div className="fixed inset-0 z-0 bg-[#FAFAFA]" />;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#FAFAFA] touch-none">
      {/* The massive interactive grid container */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        className="absolute will-change-transform cursor-grab active:cursor-grabbing"
        style={{ 
          width: WIDTH, 
          height: HEIGHT, 
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          backgroundImage: 'linear-gradient(to right, #EAEAEA 1px, transparent 1px), linear-gradient(to bottom, #EAEAEA 1px, transparent 1px)',
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
        }}
      >
        {/* Render only claimed spaces as DOM elements */}
        {spaces.map(space => {
           const index = space.id - 1;
           const c = index % COLS;
           const r = Math.floor(index / COLS);
           
           return (
             <div 
               key={space.id}
               className="absolute bg-white flex items-center justify-center group overflow-hidden border border-[#EAEAEA] cursor-pointer hover:z-10 hover:shadow-xl transition-all"
               style={{
                 left: c * CELL_SIZE,
                 top: r * CELL_SIZE,
                 width: CELL_SIZE,
                 height: CELL_SIZE
               }}
             >
               {space.logoUrl && (
                 <img 
                   src={space.logoUrl} 
                   alt={space.name}
                   className="w-[80%] h-[80%] object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" 
                 />
               )}
               {/* Tooltip on hover */}
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 hidden group-hover:block whitespace-nowrap bg-black text-white text-[10px] px-2 py-1 z-50 pointer-events-none">
                 #{space.id}: {space.name}
               </div>
             </div>
           )
        })}
      </div>
    </div>
  );
}

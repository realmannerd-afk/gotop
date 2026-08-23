'use client';

import { useEffect, useState } from 'react';
import { Space } from '@/app/actions';

export function GridVisual({ spaces }: { spaces: Space[] }) {
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });
  
  useEffect(() => {
    const update = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', update);
    update();
    return () => window.removeEventListener('resize', update);
  }, []);

  if (dimensions.w === 0) return <div className="fixed inset-0 z-0 bg-[#FAFAFA]" />;

  const cellSize = 64; // 64px boxes for better logo visibility
  const cols = Math.ceil(dimensions.w / cellSize);
  const rows = Math.ceil(dimensions.h / cellSize);
  const totalCells = cols * rows;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#FAFAFA] flex flex-wrap content-start">
      {Array.from({ length: totalCells }).map((_, i) => {
        const space = spaces.find(s => s.id === i + 1);
        return (
          <div 
            key={i} 
            style={{ width: cellSize, height: cellSize }} 
            className="border-r border-b border-[#EAEAEA] flex items-center justify-center p-3 relative group"
          >
            {space?.logoUrl ? (
              <>
                <img 
                  src={space.logoUrl} 
                  alt={space.name} 
                  className="w-full h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" 
                />
                {/* Tooltip on hover */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 hidden group-hover:block z-50">
                  <div className="bg-black text-white text-[10px] px-2 py-1 whitespace-nowrap font-mono">
                    #{space.id}: {space.name}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

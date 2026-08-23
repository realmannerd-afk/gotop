'use client';

interface GridVisualProps {
  claimed: number;
}

export function GridVisual({ claimed }: GridVisualProps) {
  const TOTAL_CELLS = 10000;
  const SPACES_PER_CELL = 100;
  
  const filledCells = Math.floor(claimed / SPACES_PER_CELL);
  const partialCell = claimed % SPACES_PER_CELL > 0 ? 1 : 0;

  return (
    <div className="w-full max-w-2xl aspect-square mx-auto p-4 md:p-8 border border-black/10 bg-white shadow-xl">
      <svg viewBox="0 0 100 100" className="w-full h-full" shapeRendering="crispEdges">
        {/* Background Empty Cells */}
        <rect width="100" height="100" fill="#F5F5F5" />
        
        {/* Render only filled cells */}
        {Array.from({ length: filledCells + partialCell }).map((_, i) => {
          const x = i % 100;
          const y = Math.floor(i / 100);
          const isPartial = i === filledCells;
          
          return (
            <rect 
              key={i} 
              x={x} 
              y={y} 
              width="0.9" 
              height="0.9" 
              fill={isPartial ? '#888' : '#111'} 
            />
          );
        })}
      </svg>
    </div>
  );
}

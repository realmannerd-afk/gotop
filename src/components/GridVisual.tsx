'use client';

interface GridVisualProps {
  total: number;
  claimedIds: number[];
}

export function GridVisual({ total, claimedIds }: GridVisualProps) {
  // We represent the 1,000,000 spaces as a 1000x1000 matrix.
  const SIDE = Math.ceil(Math.sqrt(total)); // 1000

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-transparent"
      style={{
        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        backgroundPosition: 'center center'
      }}
    >
      {/* Decorative center crosshairs */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/10" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-black/10" />

      {/* Plotting the claimed spaces */}
      {claimedIds.map((id) => {
        const index = id - 1;
        const col = index % SIDE;
        const row = Math.floor(index / SIDE);
        
        const leftPct = (col / SIDE) * 100;
        const topPct = (row / SIDE) * 100;

        return (
          <div
            key={id}
            className="absolute bg-black shadow-[0_0_8px_rgba(0,0,0,0.5)] z-10"
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: '4px',
              height: '4px',
              transform: 'translate(-50%, -50%)'
            }}
          />
        );
      })}
    </div>
  );
}

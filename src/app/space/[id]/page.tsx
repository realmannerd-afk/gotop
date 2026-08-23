import { getSpace } from '@/app/actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const space = await getSpace(id);

  if (!space) {
    return (
      <main className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-6 text-center text-white">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mb-8 uppercase">
          This space hasn&apos;t been claimed yet.
        </h1>
        <Link 
          href="/"
          className="bg-white text-black font-bold py-5 px-12 hover:bg-gray-200 transition-colors uppercase tracking-[0.2em] text-[10px]"
        >
          CLAIM YOUR SPACE
        </Link>
      </main>
    );
  }

  // Small visualization calculation (mapping 1000x1000 down to 100%)
  const SIDE = 1000;
  const leftPct = (space.x / SIDE) * 100;
  const topPct = (space.y / SIDE) * 100;
  const widthPct = (space.w / SIDE) * 100;
  const heightPct = (space.h / SIDE) * 100;
  const pixels = space.w * space.h;

  return (
    <main className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-6 text-center selection:bg-white selection:text-black text-white">
      <div className="mb-12 mt-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">
          {pixels.toLocaleString()} Pixels
        </h1>
      </div>

      <div className="bg-black border border-white/20 p-12 md:p-16 max-w-2xl w-full mb-12 shadow-[0_0_50px_rgba(255,255,255,0.05)] flex flex-col items-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white mb-6 bg-white flex items-center justify-center">
          <img src={space.logoUrl} alt={space.name} className="w-12 h-12 object-contain" />
        </div>
        
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 mb-2 uppercase">Owned By</p>
        <h2 className="text-2xl md:text-4xl font-medium leading-snug mb-2">
          {space.name}
        </h2>
        <a href={`https://${space.url}`} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-white/50 hover:text-white underline mb-10">
          {space.url}
        </a>
        
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 mb-2 uppercase">Claimed</p>
        <p className="text-sm font-mono tracking-widest text-white">
          {space.claimedAt}
        </p>
      </div>

      {/* Small visualization */}
      <div className="flex flex-col items-center mb-16">
        <p className="text-[10px] font-bold tracking-[0.2em] text-white/50 mb-4 uppercase">Location on Canvas</p>
        <div className="w-48 h-48 border border-white/20 bg-black relative shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <div 
            className="absolute bg-white mix-blend-difference"
            style={{ 
              left: `${leftPct}%`, 
              top: `${topPct}%`,
              width: `${Math.max(widthPct, 2)}%`, 
              height: `${Math.max(heightPct, 2)}%`
            }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center mb-12">
        <Link 
          href="/"
          className="bg-white text-black font-bold py-5 px-12 hover:bg-gray-200 transition-colors uppercase tracking-[0.2em] text-[10px]"
        >
          RETURN TO CANVAS
        </Link>
      </div>
    </main>
  );
}

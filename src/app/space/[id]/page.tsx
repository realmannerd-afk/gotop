import { getSpace } from '@/app/actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spaceId = parseInt(id, 10);
  
  if (isNaN(spaceId)) {
    notFound();
  }

  const space = await getSpace(spaceId);

  if (!space) {
    return (
      <main className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center text-black">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mb-8 uppercase">
          This space hasn&apos;t been claimed yet.
        </h1>
        <Link 
          href="/"
          className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] transition-colors uppercase tracking-[0.2em] text-[10px]"
        >
          CLAIM THIS SPACE
        </Link>
      </main>
    );
  }

  // Small visualization
  const TOTAL = 1000000;
  const SIDE = Math.ceil(Math.sqrt(TOTAL));
  const idx = space.id - 1;
  const col = idx % SIDE;
  const row = Math.floor(idx / SIDE);
  const leftPct = (col / SIDE) * 100;
  const topPct = (row / SIDE) * 100;

  return (
    <main className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center selection:bg-black selection:text-white text-black">
      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tighter uppercase">
          SPACE #{space.id.toLocaleString()}
        </h1>
      </div>

      <div className="bg-white border border-black/10 p-12 md:p-16 max-w-2xl w-full mb-12 shadow-sm flex flex-col items-center">
        <p className="text-[10px] font-bold tracking-[0.2em] text-black/40 mb-6 uppercase">Message</p>
        <h2 className="text-2xl md:text-3xl font-medium leading-snug mb-10">
          &quot;{space.message}&quot;
        </h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-black/40 mb-2 uppercase">Claimed</p>
        <p className="text-sm font-mono tracking-widest text-black">
          {space.claimedAt}
        </p>
      </div>

      {/* Small visualization */}
      <div className="flex flex-col items-center mb-16">
        <p className="text-[10px] font-bold tracking-[0.2em] text-black/40 mb-4 uppercase">Location in the Internet</p>
        <div className="w-48 h-48 border border-black/10 bg-white relative">
          <div 
            className="absolute bg-black w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center">
        <Link 
          href="/"
          className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] transition-colors uppercase tracking-[0.2em] text-[10px]"
        >
          CLAIM YOUR OWN SPACE
        </Link>
      </div>
    </main>
  );
}

import { getSpace } from '@/app/actions';
import Link from 'next/link';

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spaceId = parseInt(id, 10);
  
  if (isNaN(spaceId)) {
    return <div className="p-12 text-center text-[#FF3300]">Invalid Space ID</div>;
  }

  const space = await getSpace(spaceId);

  if (!space) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 h-screen w-screen bg-[#FAFAFA]">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-black mb-8">
          This space hasn&apos;t been claimed yet.
        </h1>
        <Link 
          href="/"
          className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] transition-all duration-300 uppercase tracking-widest text-sm shadow-xl"
        >
          CLAIM THIS SPACE
        </Link>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 h-screen w-screen bg-[#FAFAFA]">
      <div className="mb-12">
        <p className="text-[10px] md:text-xs tracking-[0.2em] text-gray-400 mb-4 font-bold uppercase">
          A piece of the internet
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#FF3300]">
          SPACE #{space.id.toLocaleString()}
        </h1>
      </div>

      <a href={space.url} target="_blank" rel="noopener noreferrer" className="bg-white border border-[#E5E5E5] p-12 max-w-2xl w-full mb-12 shadow-xl hover:shadow-2xl hover:border-black transition-all group flex flex-col items-center">
        {space.logoUrl ? (
          <img src={space.logoUrl} alt={space.name} className="w-24 h-24 object-contain mb-8 group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-24 h-24 bg-black mb-8" />
        )}
        <h2 className="text-2xl md:text-4xl font-bold text-black">{space.name}</h2>
        <p className="text-sm text-gray-400 mt-8 font-mono uppercase tracking-widest">
          Claimed: {space.claimedAt}
        </p>
      </a>

      <div className="flex flex-col items-center">
        <Link 
          href="/"
          className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] transition-all duration-300 uppercase tracking-widest text-sm shadow-xl"
        >
          IMMORTALIZE YOUR COMPANY
        </Link>
      </div>
    </main>
  );
}

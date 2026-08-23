import { getMockSpace } from '@/lib/mock-data';
import Link from 'next/link';

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const spaceId = parseInt(id, 10);
  
  if (isNaN(spaceId)) {
    return <div className="p-12 text-center text-[#FF3300]">Invalid Space ID</div>;
  }

  const space = getMockSpace(spaceId);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 min-h-screen">
      <div className="mb-12">
        <p className="text-xs tracking-[0.2em] text-gray-400 mb-4 font-bold uppercase">
          A piece of the internet
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[#FF3300]">
          SPACE #{space.id.toLocaleString()}
        </h1>
      </div>

      <div className="bg-white border border-[#E5E5E5] p-8 md:p-12 max-w-2xl w-full mb-12 shadow-xl">
        <p className="text-2xl md:text-4xl font-medium leading-relaxed text-black">&quot;{space.message}&quot;</p>
        <p className="text-sm text-gray-400 mt-12 font-mono uppercase tracking-widest">
          Claimed: {space.claimedAt}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <Link 
          href="/"
          className="bg-black text-white font-bold py-5 px-12 hover:bg-[#FF3300] hover:text-white transition-all duration-300 uppercase tracking-widest text-sm sm:text-base shadow-lg hover:shadow-2xl hover:shadow-[#FF3300]/20"
        >
          Claim Your Own Space
        </Link>
      </div>
    </main>
  );
}

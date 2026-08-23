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
      <main className="min-h-screen w-full bg-[#F2F1EC] flex flex-col items-center justify-center p-6 text-center text-black">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tighter mb-8">
          This space hasn&apos;t been claimed yet.
        </h1>
        <Link 
          href="/"
          className="bg-black text-[#F2F1EC] font-bold py-5 px-12 hover:bg-[#FF3300] transition-colors uppercase tracking-[0.2em] text-[10px]"
        >
          CLAIM THIS SPACE
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#F2F1EC] flex flex-col items-center justify-center p-6 text-center selection:bg-black selection:text-[#F2F1EC] text-black">
      <div className="mb-12">
        <p className="text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase mb-4">
          A piece of the internet
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          SPACE #{space.id.toLocaleString()}
        </h1>
      </div>

      <div className="bg-[#F2F1EC] border border-black/20 p-12 md:p-16 max-w-2xl w-full mb-12 shadow-2xl flex flex-col items-center">
        <h2 className="text-2xl md:text-4xl font-medium leading-snug">
          &quot;{space.message}&quot;
        </h2>
        <p className="text-[10px] text-black/40 mt-12 font-mono uppercase tracking-widest">
          Claimed: {space.claimedAt}
        </p>
      </div>

      <div className="flex flex-col items-center">
        <Link 
          href="/"
          className="bg-transparent border border-black/20 text-black font-bold py-5 px-12 hover:bg-black hover:text-[#F2F1EC] transition-colors uppercase tracking-[0.2em] text-[10px]"
        >
          THE INTERNET IS RUNNING OUT
        </Link>
      </div>
    </main>
  );
}

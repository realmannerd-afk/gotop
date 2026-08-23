'use client';

import { useState, useEffect } from 'react';
import { getClaims, claimArea, Claim } from '@/app/actions';
import { GridVisual } from '@/components/GridVisual';

const TOTAL_SPACES = 1000000;

export default function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  
  const [selectedEmpty, setSelectedEmpty] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  
  const [buyStep, setBuyStep] = useState<1 | 2>(1); // 1: Info, 2: Form
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const GOLD_START = 400;
  const GOLD_END = 600;
  const isGold = (x: number, y: number) => x >= GOLD_START && x < GOLD_END && y >= GOLD_START && y < GOLD_END;

  useEffect(() => {
    async function load() {
      try {
        const c = await getClaims();
        setClaims(c);
      } catch (err) {}
      setLoading(false);
    }
    load();
  }, []);

  const handleBlockClick = (x: number, y: number, w: number, h: number) => {
    setSelectedClaim(null);
    setSelectedEmpty({ x, y, w, h });
    setBuyStep(1);
    setFormName('');
    setFormUrl('');
    setFormDesc('');
  };

  const handleClaimClick = (claim: Claim) => {
    setSelectedEmpty(null);
    setSelectedClaim(claim);
  };

  const handleHeaderBuyClick = () => {
    // Try to find a premium gold spot first
    let foundX = 490, foundY = 490;
    let found = false;
    
    // Check center gold spot
    const centerOverlap = claims.find(c => 490 >= c.x && 490 < c.x + c.w && 490 >= c.y && 490 < c.y + c.h);
    if (!centerOverlap) {
      found = true;
    } else {
      // Find any available spot
      for (let y = 0; y < 1000 && !found; y += 10) {
        for (let x = 0; x < 1000 && !found; x += 10) {
          const overlap = claims.find(c => x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h);
          if (!overlap) {
            foundX = x;
            foundY = y;
            found = true;
          }
        }
      }
    }

    if (found) {
      handleBlockClick(foundX, foundY, 10, 10);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpty) return;
    setClaiming(true);
    try {
      const res = await claimArea(formName, formUrl, formDesc, selectedEmpty.x, selectedEmpty.y, selectedEmpty.w, selectedEmpty.h);
      setClaiming(false);
      
      if (res.error) {
        alert(res.error);
        return;
      }
      
      if (res.success && res.claim) {
        setClaims(prev => [...prev, res.claim!]);
        setSelectedEmpty(null);
        setSelectedClaim(res.claim);
      }
    } catch (err) {
      setClaiming(false);
    }
  };

  const claimedCount = claims.reduce((acc, c) => acc + (c.w * c.h), 0);
  const price = selectedEmpty ? (isGold(selectedEmpty.x, selectedEmpty.y) ? 500 : 10) : 0;
  const isPremium = selectedEmpty && isGold(selectedEmpty.x, selectedEmpty.y);

  if (loading) return <div className="h-screen w-screen bg-[#FAFAF9]" />;

  return (
    <div className="h-screen w-screen bg-[#FAFAF9] flex flex-col text-[#111111] overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="shrink-0 h-14 md:h-16 w-full flex items-center justify-between px-6 border-b border-[#E5E5E5] bg-white z-20 shadow-sm">
        <h1 className="text-xs font-bold tracking-[0.1em] uppercase">
          The Internet Is Running Out.
        </h1>
        <div className="flex items-center gap-6">
          <p className="text-[10px] uppercase tracking-widest text-[#737373] hidden md:block font-bold">
            {(TOTAL_SPACES - claimedCount).toLocaleString()} SPACES LEFT
          </p>
          <button 
            onClick={handleHeaderBuyClick}
            className="text-[10px] font-bold uppercase tracking-widest transition-colors bg-[#111111] text-white px-4 py-2 hover:bg-[#737373]"
          >
            BUY SPACE
          </button>
        </div>
      </header>

      {/* CANVAS AREA */}
      <div className="flex-1 w-full relative overflow-hidden bg-[#FAFAF9]">
        <GridVisual 
          claims={claims} 
          onBlockClick={handleBlockClick}
          onClaimClick={handleClaimClick}
        />
        
        {/* PURCHASE PANEL */}
        {selectedEmpty && (
          <div className="absolute top-6 right-6 w-80 bg-white border border-[#E5E5E5] shadow-lg flex flex-col z-30 animate-in fade-in slide-in-from-right-4 duration-200">
            {buyStep === 1 ? (
              <div className="p-6 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <h2 className={`text-[10px] uppercase tracking-widest font-bold ${isPremium ? 'text-[#D4AF37]' : ''}`}>
                    {isPremium ? 'Buy Gold Space' : 'Buy Space'}
                  </h2>
                  <button onClick={() => setSelectedEmpty(null)} className="text-[#737373] hover:text-[#111111] text-lg leading-none">&times;</button>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] uppercase text-[#737373] font-bold tracking-widest">Location</span>
                  <span className="font-mono text-xs">X: {selectedEmpty.x} Y: {selectedEmpty.y}</span>
                </div>
                <div className="flex justify-between mb-6">
                  <span className="text-[10px] uppercase text-[#737373] font-bold tracking-widest">Size</span>
                  <span className="font-mono text-xs">{selectedEmpty.w} &times; {selectedEmpty.h}</span>
                </div>
                <div className="flex justify-between mb-8 border-t border-[#E5E5E5] pt-4">
                  <span className="text-[10px] uppercase text-[#737373] font-bold tracking-widest">Price</span>
                  <span className={`font-mono text-sm font-bold ${isPremium ? 'text-[#D4AF37]' : ''}`}>
                    ${price}
                  </span>
                </div>
                
                <button 
                  onClick={() => setBuyStep(2)}
                  className={`w-full text-white py-3 text-[10px] uppercase tracking-widest font-bold transition-colors ${isPremium ? 'bg-[#D4AF37] hover:bg-[#C5A028]' : 'bg-[#111111] hover:bg-[#737373]'}`}
                >
                  Continue
                </button>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="p-6 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-[10px] uppercase tracking-widest font-bold">Details</h2>
                  <button type="button" onClick={() => setSelectedEmpty(null)} className="text-[#737373] hover:text-[#111111] text-lg leading-none">&times;</button>
                </div>

                <input type="text" placeholder="Product Name" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full border-b border-[#E5E5E5] pb-2 mb-4 text-xs focus:outline-none focus:border-[#111111] bg-transparent" />
                <input type="url" placeholder="Website URL" value={formUrl} onChange={e => setFormUrl(e.target.value)} required className="w-full border-b border-[#E5E5E5] pb-2 mb-4 text-xs focus:outline-none focus:border-[#111111] bg-transparent" />
                <input type="text" placeholder="Short description" value={formDesc} onChange={e => setFormDesc(e.target.value)} required maxLength={80} className="w-full border-b border-[#E5E5E5] pb-2 mb-8 text-xs focus:outline-none focus:border-[#111111] bg-transparent" />

                <button 
                  type="submit"
                  disabled={claiming}
                  className={`w-full text-white py-3 text-[10px] uppercase tracking-widest font-bold transition-colors disabled:opacity-50 ${isPremium ? 'bg-[#D4AF37] hover:bg-[#C5A028]' : 'bg-[#111111] hover:bg-[#737373]'}`}
                >
                  {claiming ? 'Processing...' : `Confirm $${price}`}
                </button>
              </form>
            )}
          </div>
        )}

        {/* INFO PANEL */}
        {selectedClaim && (
          <div className="absolute top-6 right-6 w-80 bg-white border border-[#E5E5E5] shadow-lg flex flex-col z-30 p-6 animate-in fade-in slide-in-from-right-4 duration-200">
             <div className="flex justify-between items-start mb-6">
                <img src={selectedClaim.logoUrl} alt="" className="w-8 h-8 object-contain" />
                <button onClick={() => setSelectedClaim(null)} className="text-[#737373] hover:text-[#111111] text-lg leading-none">&times;</button>
             </div>
             <h3 className="font-bold text-sm mb-2 uppercase tracking-tight">{selectedClaim.name}</h3>
             <p className="text-xs text-[#737373] mb-8 leading-relaxed">
               {selectedClaim.description}
             </p>
             <div className="flex gap-4">
               <a href={`https://${selectedClaim.url}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#111111] text-white text-center py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-[#737373] transition-colors">
                 Visit
               </a>
               <button onClick={() => setSelectedClaim(null)} className="flex-1 border border-[#E5E5E5] bg-white text-[#111111] py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-[#FAFAF9] transition-colors">
                 Close
               </button>
             </div>
          </div>
        )}
      </div>

    </div>
  );
}

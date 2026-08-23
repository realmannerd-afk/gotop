"use server";

export interface Claim {
  id: string;
  name: string;
  url: string;
  logoUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Initial mock data with some interesting placements
let claims: Claim[] = [
  { id: '1', name: 'Stripe', url: 'stripe.com', logoUrl: 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128', x: 480, y: 480, w: 40, h: 40 },
  { id: '2', name: 'Vercel', url: 'vercel.com', logoUrl: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=128', x: 530, y: 480, w: 20, h: 20 },
  { id: '3', name: 'GitHub', url: 'github.com', logoUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=128', x: 450, y: 530, w: 30, h: 30 },
];

export async function getClaims() {
  return claims;
}

export async function claimArea(name: string, url: string, x: number, y: number, w: number, h: number) {
  if (!name || !url) return { error: 'Company Name and URL are required.' };
  
  // Clean URL for favicon extraction
  const cleanUrl = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  const logoUrl = `https://www.google.com/s2/favicons?domain=${cleanUrl}&sz=128`;

  const newClaim: Claim = {
    id: Math.random().toString(36).substring(7),
    name,
    url: cleanUrl,
    logoUrl,
    x, y, w, h
  };

  claims.push(newClaim);

  return { success: true, claim: newClaim };
}

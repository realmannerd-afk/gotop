"use server";

export interface Claim {
  id: string;
  name: string;
  url: string;
  logoUrl: string;
  description: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

let claims: Claim[] = [
  { id: '1', name: 'Stripe', url: 'stripe.com', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg', description: 'Financial infrastructure for the internet.', x: 200, y: 200, w: 80, h: 40 },
  { id: '2', name: 'Vercel', url: 'vercel.com', logoUrl: 'https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png', description: 'Develop. Preview. Ship.', x: 300, y: 200, w: 50, h: 50 },
  { id: '3', name: 'GitHub', url: 'github.com', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg', description: 'Where the world builds software.', x: 400, y: 400, w: 60, h: 60 },
  { id: '4', name: 'Apple', url: 'apple.com', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', description: 'Think different.', x: 500, y: 300, w: 50, h: 60 },
  { id: '5', name: 'Nike', url: 'nike.com', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', description: 'Just do it.', x: 600, y: 500, w: 80, h: 40 },
  { id: '6', name: 'React', url: 'react.dev', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg', description: 'The library for web and native user interfaces.', x: 700, y: 250, w: 60, h: 60 },
];

export async function getClaims() {
  return claims;
}

export async function getSpace(id: string) {
  const claim = claims.find(c => c.id === id);
  if (!claim) return null;
  return {
    ...claim,
    claimedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  };
}

export async function claimArea(name: string, url: string, description: string, x: number, y: number, w: number, h: number) {
  if (!name || !url) return { error: 'Company Name and URL are required.' };
  
  const cleanUrl = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
  const logoUrl = `https://www.google.com/s2/favicons?domain=${cleanUrl}&sz=128`;

  const newClaim: Claim = {
    id: Math.random().toString(36).substring(7),
    name,
    url: cleanUrl,
    logoUrl,
    description: description || '',
    x, y, w, h
  };

  claims.push(newClaim);
  return { success: true, claim: newClaim };
}

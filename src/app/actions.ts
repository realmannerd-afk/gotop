"use server";

export interface Space {
  id: number;
  message: string;
  claimedAt: string;
}

let simulatedClaimCount = 734199;
let recentClaims: Space[] = [
  { id: 734199, message: "I was here.", claimedAt: new Date().toISOString() },
  { id: 734198, message: "hello internet", claimedAt: new Date().toISOString() },
  { id: 734197, message: "🚀", claimedAt: new Date().toISOString() },
  { id: 734196, message: "Testing from Vercel", claimedAt: new Date().toISOString() },
  { id: 734195, message: "Minimalism.", claimedAt: new Date().toISOString() },
];

export async function getStats() {
  return { claimed: simulatedClaimCount };
}

export async function getAllClaims() {
  return recentClaims.map(d => ({
    ...d,
    claimedAt: new Date(d.claimedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }));
}

export async function getSpace(id: number) {
  const space = recentClaims.find(s => s.id === id);
  if (!space) {
    return {
      id,
      message: "This is a historical space.",
      claimedAt: "1 Jan 2026"
    };
  }
  return {
    ...space,
    claimedAt: new Date(space.claimedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  };
}

export async function claimSpace(message: string) {
  if (!message || message.length > 80) return { error: 'Message must be 1-80 chars.' };
  
  simulatedClaimCount++;
  const nextId = simulatedClaimCount;
  
  if (nextId > 1000000) return { error: 'All spaces claimed.' };

  const newClaim = {
    id: nextId,
    message,
    claimedAt: new Date().toISOString()
  };

  recentClaims.unshift(newClaim);
  if (recentClaims.length > 10) recentClaims.pop();

  return { success: true, id: nextId };
}

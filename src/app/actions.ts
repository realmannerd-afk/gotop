"use server";

export interface Space {
  id: number;
  message: string;
  claimedAt: string;
}

// MOCK DATA STORE (per instructions)
let mockSpaces: Space[] = Array.from({ length: 734199 }, (_, i) => ({
  id: i + 1,
  message: i % 2 === 0 ? "I was here." : "hello internet",
  claimedAt: new Date().toISOString()
}));

export async function getStats() {
  return { claimed: mockSpaces.length };
}

export async function getAllClaims() {
  // Return latest 10
  return [...mockSpaces].reverse().slice(0, 10).map(d => ({
    id: d.id,
    message: d.message,
    claimedAt: new Date(d.claimedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  }));
}

export async function getSpace(id: number) {
  const space = mockSpaces.find(s => s.id === id);
  if (!space) return null;
  return {
    ...space,
    claimedAt: new Date(space.claimedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
  };
}

export async function claimSpace(message: string) {
  if (!message || message.length > 80) return { error: 'Message must be 1-80 chars.' };
  
  const nextId = mockSpaces.length + 1;
  if (nextId > 1000000) return { error: 'All spaces claimed.' };

  mockSpaces.push({
    id: nextId,
    message,
    claimedAt: new Date().toISOString()
  });

  return { success: true, id: nextId };
}

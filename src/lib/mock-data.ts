export const TOTAL_SPACES = 1000000;
export const INITIAL_CLAIMED = 734201;

export interface Space {
  id: number;
  message: string;
  claimedAt: string;
}

// Fixed mock list for recent claims
export const RECENT_CLAIMS: Space[] = [
  { id: 734201, message: "I was here.", claimedAt: "23 August 2026" },
  { id: 734200, message: "hello internet", claimedAt: "23 August 2026" },
  { id: 734199, message: "??", claimedAt: "23 August 2026" },
  { id: 734198, message: "last piece of history", claimedAt: "23 August 2026" },
  { id: 734197, message: "digital footprint", claimedAt: "23 August 2026" },
];

export const getMockSpace = (id: number): Space => {
  const existing = RECENT_CLAIMS.find(c => c.id === id);
  if (existing) return existing;
  return {
    id,
    message: "A piece of the internet.",
    claimedAt: "23 August 2026"
  };
};

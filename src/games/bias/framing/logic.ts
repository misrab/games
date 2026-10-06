export interface FramePair {
  id: string;
  live: number;
  dead: number;
}

export const scenes: FramePair[] = [
  { id: 'disease', live: 200, dead: 400 },
  { id: 'jobs', live: 300, dead: 300 },
  { id: 'crops', live: 150, dead: 450 },
];

export function flipRate(mismatch: number, total: number): number {
  return Math.round((mismatch / total) * 100);
}

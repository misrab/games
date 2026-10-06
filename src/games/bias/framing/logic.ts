export interface FramePair {
  id: string;
  live: number;
  dead: number;
}

export function flipRate(mismatch: number, total: number): number {
  return Math.round((mismatch / total) * 100);
}

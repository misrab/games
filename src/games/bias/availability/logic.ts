export interface Pair {
  id: string;
  a: number;
  b: number;
  vivid: 'a' | 'b' | null;
}

export const pairs: Pair[] = [
  { id: 'plane', a: 1, b: 730, vivid: 'a' },
  { id: 'car', a: 730, b: 1, vivid: null },
  { id: 'flood', a: 89, b: 1200, vivid: 'a' },
  { id: 'asthma', a: 1200, b: 89, vivid: null },
];

export function errorRate(picks: { correct: boolean }[]): number {
  const wrong = picks.filter((p) => !p.correct).length;
  return Math.round((wrong / picks.length) * 100);
}

export function correctPick(pair: Pair, choice: 'a' | 'b'): boolean {
  return pair.a >= pair.b ? choice === 'a' : choice === 'b';
}

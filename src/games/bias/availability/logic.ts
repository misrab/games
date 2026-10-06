export interface Pair {
  id: string;
  a: number;
  b: number;
  vivid: 'a' | 'b' | null;
}

export const pairs: Pair[] = [
  { id: 'shark', a: 5, b: 30, vivid: 'a' },
  { id: 'lightning', a: 20, b: 400, vivid: 'a' },
  { id: 'tornado', a: 70, b: 700, vivid: 'a' },
  { id: 'plane', a: 1, b: 730, vivid: null },
  { id: 'lottery', a: 1, b: 400, vivid: null },
  { id: 'homicide', a: 6, b: 14, vivid: null },
];

export function errorRate(picks: { correct: boolean }[]): number {
  const wrong = picks.filter((p) => !p.correct).length;
  return Math.round((wrong / picks.length) * 100);
}

export function correctPick(pair: Pair, choice: 'a' | 'b'): boolean {
  return pair.a >= pair.b ? choice === 'a' : choice === 'b';
}

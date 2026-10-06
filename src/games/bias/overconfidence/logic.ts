export interface Item {
  id: string;
  truth: number;
  min: number;
  max: number;
}

export const items: Item[] = [
  { id: 'un', truth: 193, min: 50, max: 400 },
  { id: 'amazon', truth: 6400, min: 500, max: 15000 },
  { id: 'english', truth: 170000, min: 20000, max: 500000 },
  { id: 'heart', truth: 100000, min: 5000, max: 300000 },
  { id: 'everest', truth: 8849, min: 2000, max: 20000 },
  { id: 'moonkm', truth: 384400, min: 50000, max: 1000000 },
];

export function inRange(low: number, high: number, truth: number): boolean {
  return truth >= low && truth <= high;
}

export function overconfidenceRate(hits: number, total: number): number {
  const target = Math.ceil(total * 0.9);
  const gap = Math.max(0, target - hits);
  return Math.round((gap / total) * 100);
}

import { estimateQuestions } from '../../../bias/kit/questions';

export interface Item {
  id: string;
  truth: number;
  min: number;
  max: number;
}

export const items: Item[] = estimateQuestions.map((q) => ({
  id: q.id,
  truth: q.truth,
  min: q.min,
  max: q.max,
}));

export function inRange(low: number, high: number, truth: number): boolean {
  return truth >= low && truth <= high;
}

export function overconfidenceRate(hits: number, total: number): number {
  const target = Math.ceil(total * 0.9);
  const gap = Math.max(0, target - hits);
  return Math.round((gap / total) * 100);
}

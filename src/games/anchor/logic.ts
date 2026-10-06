import type { Rng } from '../../core/rng';

export type Side = 'low' | 'high';

export interface Question {
  id: string;
  truth: number;
  min: number;
  max: number;
  low: number;
  high: number;
}

export interface Round {
  q: Question;
  side: Side;
  aided: boolean;
  gut?: number;
  guess: number;
}

export interface Summary {
  cold: number;
  aided: number;
  score: number;
}

export const PHASE_SIZE = 3;

export const questions: Question[] = [
  { id: 'nile', truth: 6650, min: 0, max: 20000, low: 2000, high: 15000 },
  { id: 'bones', truth: 206, min: 0, max: 1000, low: 50, high: 700 },
  { id: 'moon', truth: 384400, min: 0, max: 2000000, low: 50000, high: 1500000 },
  { id: 'whale', truth: 30, min: 0, max: 100, low: 8, high: 80 },
  { id: 'sound', truth: 343, min: 0, max: 3000, low: 100, high: 2000 },
  { id: 'piano', truth: 88, min: 0, max: 400, low: 30, high: 300 },
  { id: 'eiffel', truth: 330, min: 0, max: 1500, low: 100, high: 1000 },
  { id: 'kili', truth: 5895, min: 0, max: 20000, low: 2000, high: 15000 },
  { id: 'trench', truth: 10900, min: 0, max: 30000, low: 3000, high: 25000 },
  { id: 'diameter', truth: 3474, min: 0, max: 20000, low: 800, high: 12000 },
  { id: 'phone', truth: 1876, min: 1500, max: 2000, low: 1650, high: 1960 },
  { id: 'everest', truth: 8849, min: 0, max: 30000, low: 3000, high: 20000 },
];

function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface Plan {
  q: Question;
  side: Side;
  aided: boolean;
}

export function buildPlan(rng: Rng): Plan[] {
  const picked = shuffle(questions, rng).slice(0, PHASE_SIZE * 2);
  const plan: Plan[] = [];
  for (const aided of [false, true]) {
    const extra: Side = rng() < 0.5 ? 'low' : 'high';
    const sides = shuffle<Side>(['low', 'high', extra], rng);
    sides.forEach((side, i) => {
      plan.push({ q: picked[(aided ? PHASE_SIZE : 0) + i], side, aided });
    });
  }
  return plan;
}

export function anchorOf(q: Question, side: Side): number {
  return side === 'high' ? q.high : q.low;
}

export function valueAt(q: Question, frac: number): number {
  return Math.round(q.min + (q.max - q.min) * frac);
}

export function fracOf(q: Question, value: number): number {
  return (value - q.min) / (q.max - q.min);
}

/** How far the guess moved from the truth toward the anchor: 0 none, 1 all the way. */
export function pull(q: Question, side: Side, guess: number): number {
  const anchor = anchorOf(q, side);
  const raw = (guess - q.truth) / (anchor - q.truth);
  return Math.max(-1, Math.min(1, raw));
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

export function summarize(rounds: Round[]): Summary {
  const of = (aided: boolean) =>
    mean(rounds.filter((r) => r.aided === aided).map((r) => pull(r.q, r.side, r.guess)));
  const cold = of(false);
  const aided = of(true);
  const all = mean(rounds.map((r) => pull(r.q, r.side, r.guess)));
  return { cold, aided, score: Math.round(100 * (1 - Math.max(0, Math.min(1, all)))) };
}

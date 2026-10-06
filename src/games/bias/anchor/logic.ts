import { estimateQuestions, type EstimateQuestion } from '../../../bias/kit/questions';
import { TRAP_ROUNDS } from '../../../bias/kit/flow';
import type { Rng } from '../../../core/rng';

export type Side = 'low' | 'high';
export const PHASE = TRAP_ROUNDS;

export type Question = EstimateQuestion;

export interface Round {
  q: Question;
  side: Side;
  aided: boolean;
  anchor: number;
  rangeLow?: number;
  rangeHigh?: number;
  guess: number;
}

export const questions = estimateQuestions;

function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function anchorOf(q: Question, side: Side): number {
  return side === 'high' ? q.high : q.low;
}

export function fracOf(q: Question, value: number): number {
  return (value - q.min) / (q.max - q.min);
}

export function pull(q: Question, anchor: number, guess: number): number {
  if (anchor === q.truth) return 0;
  const raw = (guess - q.truth) / (anchor - q.truth);
  return Math.max(-1, Math.min(1, raw));
}

export function buildPlan(rng: Rng): Omit<Round, 'guess' | 'anchor'>[] {
  const picked = shuffle(questions, rng).slice(0, PHASE * 2);
  const plan: Omit<Round, 'guess' | 'anchor'>[] = [];
  for (const aided of [false, true]) {
    const sides = shuffle<Side>(['low', 'high', 'high'], rng);
    sides.forEach((side, i) => {
      plan.push({ q: picked[(aided ? PHASE : 0) + i], side, aided });
    });
  }
  return plan;
}

export function meters(rounds: Round[]): { before: number; after: number; accuracy: number } {
  const pullOf = (aided: boolean) => {
    const rs = rounds.filter((r) => r.aided === aided);
    if (rs.length === 0) return 0;
    return rs.reduce((s, r) => s + Math.max(0, pull(r.q, r.anchor, r.guess)), 0) / rs.length;
  };
  const acc = rounds.reduce((s, r) => s + (Math.abs(r.guess - r.q.truth) < (r.q.max - r.q.min) * 0.15 ? 1 : 0), 0);
  return {
    before: Math.round(pullOf(false) * 100),
    after: Math.round(pullOf(true) * 100),
    accuracy: Math.round((acc / rounds.length) * 100),
  };
}

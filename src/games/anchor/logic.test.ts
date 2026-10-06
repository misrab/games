import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../core/rng';
import { anchorOf, buildPlan, fracOf, pull, questions, summarize, valueAt, PHASE_SIZE, type Round } from './logic';

const q = { id: 't', truth: 100, min: 0, max: 1000, low: 20, high: 500 };

describe('pull', () => {
  it('is 0 on the truth and 1 on the anchor', () => {
    expect(pull(q, 'high', 100)).toBe(0);
    expect(pull(q, 'high', 500)).toBe(1);
    expect(pull(q, 'low', 20)).toBe(1);
  });

  it('is signed and clamped', () => {
    expect(pull(q, 'high', 300)).toBeCloseTo(0.5);
    expect(pull(q, 'high', 0)).toBeLessThan(0);
    expect(pull(q, 'high', 900)).toBe(1);
  });
});

describe('scale', () => {
  it('round-trips value and fraction', () => {
    expect(valueAt(q, 0.5)).toBe(500);
    expect(fracOf(q, 250)).toBe(0.25);
  });
});

describe('buildPlan', () => {
  it('gives two phases of distinct questions with mixed anchors', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const plan = buildPlan(mulberry32(seed));
      expect(plan).toHaveLength(PHASE_SIZE * 2);
      expect(new Set(plan.map((p) => p.q.id)).size).toBe(plan.length);
      expect(plan.slice(0, PHASE_SIZE).every((p) => !p.aided)).toBe(true);
      expect(plan.slice(PHASE_SIZE).every((p) => p.aided)).toBe(true);
      for (const phase of [plan.slice(0, PHASE_SIZE), plan.slice(PHASE_SIZE)]) {
        expect(new Set(phase.map((p) => p.side)).size).toBe(2);
      }
    }
  });
});

describe('questions', () => {
  it('keep the truth inside the scale and between the anchors', () => {
    for (const item of questions) {
      expect(item.truth, item.id).toBeGreaterThan(item.low);
      expect(item.truth, item.id).toBeLessThan(item.high);
      expect(item.low, item.id).toBeGreaterThanOrEqual(item.min);
      expect(item.high, item.id).toBeLessThanOrEqual(item.max);
    }
  });
});

describe('summarize', () => {
  it('splits pull by phase and scores resistance', () => {
    const rounds: Round[] = [
      { q, side: 'high', aided: false, guess: 500 },
      { q, side: 'low', aided: false, guess: 20 },
      { q, side: 'high', aided: true, guess: 100 },
      { q, side: 'low', aided: true, guess: 100 },
    ];
    const s = summarize(rounds);
    expect(s.cold).toBe(1);
    expect(s.aided).toBe(0);
    expect(s.score).toBe(50);
    expect(anchorOf(q, 'high')).toBe(500);
  });
});

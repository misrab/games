import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../../core/rng';
import { anchorOf, buildPlan, meters, pull } from './logic';

describe('anchor logic', () => {
  it('builds six rounds', () => {
    expect(buildPlan(mulberry32(1))).toHaveLength(6);
  });

  it('scores pull toward anchor', () => {
    const q = { id: 't', truth: 100, min: 0, max: 1000, low: 20, high: 500 };
    expect(pull(q, 500, 500)).toBe(1);
    const rounds = [
      { q, side: 'high' as const, aided: false, anchor: 500, guess: 500 },
      { q, side: 'low' as const, aided: true, anchor: 20, guess: 100 },
    ];
    expect(meters(rounds).before).toBeGreaterThan(0);
    expect(anchorOf(q, 'high')).toBe(500);
  });
});

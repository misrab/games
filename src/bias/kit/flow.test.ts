import { describe, expect, it } from 'vitest';
import { stepAfterRound, TRAP_ROUNDS, TOTAL_ROUNDS } from './flow';

describe('stepAfterRound', () => {
  it('matches the six-round debiasing loop', () => {
    expect(stepAfterRound(0)).toBe('play');
    expect(stepAfterRound(TRAP_ROUNDS - 1)).toBe('tip');
    expect(stepAfterRound(TOTAL_ROUNDS - 1)).toBe('done');
  });
});

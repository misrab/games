import { describe, expect, it } from 'vitest';
import { taxiBlueRate } from './logic';

describe('representativeness', () => {
  it('blue cab rate is below 50%', () => {
    expect(taxiBlueRate()).toBeCloseTo(0.41, 1);
  });
});

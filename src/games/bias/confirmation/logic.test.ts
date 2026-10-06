import { describe, expect, it } from 'vitest';
import { biasRate, rules } from './logic';

describe('confirmation', () => {
  it('scores confirmatory tests', () => {
    expect(biasRate([true, true, false])).toBe(67);
    expect(rules[0].fits(2, 4, 6)).toBe(true);
  });
});

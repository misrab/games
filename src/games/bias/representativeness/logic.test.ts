import { describe, expect, it } from 'vitest';
import { cases } from './logic';

describe('representativeness', () => {
  it('uses a different case each round', () => {
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    expect(cases).toHaveLength(6);
    expect(cases[0].truth).toBe(41);
  });
});

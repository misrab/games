import { describe, expect, it } from 'vitest';
import en from '../i18n/en.json';
import { registry } from '../registry';
import { curriculum } from './catalog';

describe('curriculum', () => {
  it('lists every bias with copy, paper link, and lazy subgame', () => {
    const messages = en as Record<string, string>;
    expect(registry.some((game) => game.id === 'bias')).toBe(true);
    expect(curriculum).toHaveLength(11);
    for (const bias of curriculum) {
      expect(messages[`bias.${bias.id}.name`], bias.id).toBeTruthy();
      expect(messages[`bias.${bias.id}.body`], bias.id).toBeTruthy();
      expect(messages[`bias.${bias.id}.link`], bias.id).toBeTruthy();
      expect(messages[`bias.${bias.id}.url`], bias.id).toMatch(/^https:\/\/doi\.org\/10\./);
      expect(typeof bias.load).toBe('function');
    }
  });
});

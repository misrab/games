import { describe, expect, it } from 'vitest';
import en from './i18n/en.json';
import { registry } from './registry';

describe('platforms', () => {
  it('gives every game desktop and touch controls', () => {
    expect(registry.length).toBeGreaterThan(0);
    for (const game of registry) {
      const messages = en as Record<string, string>;
      expect(messages[game.instructionsKey], game.id).toBeTruthy();
      expect(messages[`${game.controlsKey}.desktop`], game.id).toBeTruthy();
      expect(messages[`${game.controlsKey}.touch`], game.id).toBeTruthy();
    }
  });
});

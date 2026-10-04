import { describe, expect, it } from 'vitest';
import { clearPauseHolds, isSimulationPaused, setPauseHold } from './loop';

describe('pause holds', () => {
  it('pauses while any hold is set', () => {
    clearPauseHolds();
    expect(isSimulationPaused()).toBe(false);
    setPauseHold('how', true);
    setPauseHold('hidden', true);
    setPauseHold('how', false);
    expect(isSimulationPaused()).toBe(true);
    setPauseHold('hidden', false);
    expect(isSimulationPaused()).toBe(false);
  });
});

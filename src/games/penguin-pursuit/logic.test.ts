import { describe, expect, it } from 'vitest';
import { isMazeFullyConnected, mapScreenToWorld, newRace, nextLevel, screenDelta, step, tick } from './logic';

describe('mapScreenToWorld', () => {
  it('rotates up with the board', () => {
    const up = screenDelta('up')!;
    expect(mapScreenToWorld(up, 0)).toEqual({ r: -1, c: 0 });
    expect(mapScreenToWorld(up, 1)).toEqual({ r: 0, c: -1 });
    expect(mapScreenToWorld(up, 2)).toEqual({ r: 1, c: 0 });
    expect(mapScreenToWorld(up, 3)).toEqual({ r: 0, c: 1 });
  });
});

describe('maze', () => {
  it('has walls and one connected path', () => {
    const state = newRace(42, 1);
    expect(isMazeFullyConnected(state.passable)).toBe(true);
  });
});

describe('race', () => {
  it('ends when you reach the fish', () => {
    let state = newRace(1, 1);
    state = {
      ...state,
      passable: [
        [true, true],
        [true, true],
      ],
      player: { r: 0, c: 0 },
      fish: { r: 0, c: 1 },
      rotation: 0,
    };
    state = step(state, 'right');
    expect(state.winner).toBe('you');
    expect(state.phase).toBe('done');
  });

  it('lets the rival win', () => {
    let state = newRace(1, 1);
    state = {
      ...state,
      aiSpeedMs: 10,
      msRival: 100,
      passable: [
        [true, true],
        [false, true],
      ],
      player: { r: 0, c: 0 },
      rival: { r: 0, c: 1 },
      fish: { r: 1, c: 1 },
    };
    state = tick(state, 20);
    expect(state.winner).toBe('rival');
  });

  it('raises level after a win', () => {
    expect(nextLevel(2, true)).toBe(3);
    expect(nextLevel(1, false)).toBe(1);
  });
});

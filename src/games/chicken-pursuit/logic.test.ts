import { describe, expect, it } from 'vitest';
import { isMazeFullyConnected, mapScreenToWorld, newRace, screenDelta, step, tick } from './logic';

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
    const state = newRace(42, 'normal');
    expect(isMazeFullyConnected(state.passable)).toBe(true);
  });

  it('grows with difficulty', () => {
    expect(newRace(3, 'easy').passable.length).toBeLessThan(newRace(3, 'hard').passable.length);
  });
});

describe('race', () => {
  it('ends when you reach the food', () => {
    let state = newRace(1, 'easy');
    state = {
      ...state,
      passable: [
        [true, true],
        [true, true],
      ],
      player: { r: 0, c: 0 },
      food: { r: 0, c: 1 },
      rotation: 0,
    };
    state = step(state, 'right');
    expect(state.winner).toBe('you');
    expect(state.phase).toBe('done');
  });

  it('lets the rival win', () => {
    let state = newRace(1, 'easy');
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
      food: { r: 1, c: 1 },
    };
    state = tick(state, 20);
    expect(state.winner).toBe('rival');
  });
});

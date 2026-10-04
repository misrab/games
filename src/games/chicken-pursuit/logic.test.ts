import { describe, expect, it } from 'vitest';
import { isMazeFullyConnected, mapScreenToWorld, newRace, screenDelta, step, tick, type State } from './logic';

function pathSteps(state: State): number {
  const size = state.passable.length;
  const q = [{ r: state.player.r, c: state.player.c, d: 0 }];
  const seen = new Set([`${state.player.r},${state.player.c}`]);
  while (q.length) {
    const cur = q.shift()!;
    if (cur.r === state.food.r && cur.c === state.food.c) return cur.d;
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const) {
      const n = { r: cur.r + dr, c: cur.c + dc, d: cur.d + 1 };
      const key = `${n.r},${n.c}`;
      if (n.r < 0 || n.c < 0 || n.r >= size || n.c >= size || !state.passable[n.r][n.c] || seen.has(key)) continue;
      seen.add(key);
      q.push(n);
    }
  }
  return 0;
}

describe('mapScreenToWorld', () => {
  it('turns a screen tap with the yard', () => {
    const up = screenDelta('up')!;
    expect(mapScreenToWorld(up, 0)).toEqual({ r: -1, c: 0 });
    expect(mapScreenToWorld(up, 1)).toEqual({ r: 0, c: -1 });
    expect(mapScreenToWorld(up, 2)).toEqual({ r: 1, c: 0 });
    expect(mapScreenToWorld(up, 3)).toEqual({ r: 0, c: 1 });
  });
});

describe('arrows', () => {
  it('stay aimed at north when the yard turns', () => {
    let state = newRace(1, '1');
    state = {
      ...state,
      rotation: 1,
      passable: [
        [true, true, true],
        [true, true, true],
        [true, true, true],
      ],
      player: { r: 1, c: 1 },
      food: { r: 2, c: 2 },
    };
    expect(step(state, 'up').player).toEqual({ r: 0, c: 1 });
    expect(step(state, 'right').player).toEqual({ r: 1, c: 2 });
  });
});

describe('maze', () => {
  it('has walls and one connected path', () => {
    const state = newRace(42, '3');
    expect(isMazeFullyConnected(state.passable)).toBe(true);
  });

  it('grows the yard and turns it faster at higher levels', () => {
    const low = newRace(3, '1');
    const high = newRace(3, '5');
    expect(high.passable.length).toBeGreaterThan(low.passable.length);
    expect(high.rotateEveryMs).toBeLessThan(low.rotateEveryMs);
    expect(high.aiSpeedMs).toBeLessThan(low.aiSpeedMs);
    expect(pathSteps(high)).toBeGreaterThan(pathSteps(low));
  });

  it('turns the yard on schedule', () => {
    let state = newRace(1, '5');
    state = tick(state, state.rotateEveryMs);
    expect(state.rotation).toBe(1);
  });
});

describe('race', () => {
  it('ends when you reach the food', () => {
    let state = newRace(1, '1');
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
    let state = newRace(1, '1');
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

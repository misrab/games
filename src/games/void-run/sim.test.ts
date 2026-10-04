import { describe, expect, it } from 'vitest';
import { createState, resize, update, type Enemy, type InputState } from './sim';

const still: InputState = { ax: 0, ay: 0, aimX: 0, aimY: 0, hasAim: false, steering: false, firing: false };

function field() {
  const state = createState(7);
  resize(state, 480, 720);
  state.rocks = [];
  state.enemies = [];
  state.bullets = [];
  state.ship.vx = 0;
  state.ship.vy = 0;
  return state;
}

describe('void run', () => {
  it('scores a dart when a shot connects', () => {
    const state = field();
    const enemy: Enemy = {
      kind: 'dart',
      x: 240,
      y: 360,
      vx: 0,
      vy: 0,
      hp: 1,
      r: 16,
      cooldown: 9,
      spin: 0,
    };
    state.enemies.push(enemy);
    state.bullets.push({ x: 240, y: 360, vx: 0, vy: 0, friendly: true, life: 1, r: 4 });
    update(state, still, 1 / 60);
    expect(state.score).toBe(100);
    expect(state.enemies).toHaveLength(0);
  });

  it('breaches the hull on contact', () => {
    const state = field();
    state.ship.hp = 1;
    state.ship.invuln = 0;
    state.enemies.push({
      kind: 'dart',
      x: state.ship.x,
      y: state.ship.y,
      vx: 0,
      vy: 0,
      hp: 4,
      r: 28,
      cooldown: 9,
      spin: 0,
    });
    update(state, still, 1 / 60);
    expect(state.over).toBe(true);
    expect(state.ship.alive).toBe(false);
  });

  it('stays put when the pointer is only aiming', () => {
    const state = field();
    const x = state.ship.x;
    const y = state.ship.y;
    for (let i = 0; i < 90; i++) {
      update(state, { ...still, hasAim: true, aimX: 80, aimY: 80 }, 1 / 60);
    }
    expect(state.ship.x).toBe(x);
    expect(state.ship.y).toBe(y);
    expect(state.ship.vx).toBe(0);
  });

  it('stops on a drag instead of flying past it', () => {
    const state = field();
    const startX = state.ship.x;
    const startY = state.ship.y;
    const target = { x: startX + 180, y: startY - 40 };
    const dx = target.x - startX;
    const dy = target.y - startY;
    const len = Math.hypot(dx, dy);
    let past = 0;
    for (let i = 0; i < 180; i++) {
      update(
        state,
        { ...still, hasAim: true, steering: true, aimX: target.x, aimY: target.y },
        1 / 60,
      );
      const along = ((state.ship.x - startX) * dx + (state.ship.y - startY) * dy) / len;
      past = Math.max(past, along - len);
    }
    expect(Math.hypot(state.ship.x - target.x, state.ship.y - target.y)).toBeLessThan(24);
    expect(Math.hypot(state.ship.vx, state.ship.vy)).toBeLessThan(12);
    expect(past).toBeLessThan(16);
  });

  it('caps keyboard speed', () => {
    const state = field();
    for (let i = 0; i < 30; i++) update(state, { ...still, ax: 1 }, 1 / 60);
    const speed = Math.hypot(state.ship.vx, state.ship.vy);
    expect(speed).toBeGreaterThan(200);
    expect(speed).toBeLessThanOrEqual(280);
    update(state, still, 0.4);
    expect(Math.hypot(state.ship.vx, state.ship.vy)).toBe(0);
  });
});

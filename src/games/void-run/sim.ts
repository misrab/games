import { mulberry32, type Rng } from '../../core/rng';

export interface InputState {
  ax: number;
  ay: number;
  aimX: number;
  aimY: number;
  hasAim: boolean;
  steering: boolean;
  firing: boolean;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  friendly: boolean;
  life: number;
  r: number;
}

export interface Enemy {
  kind: 'dart' | 'saucer';
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  r: number;
  cooldown: number;
  spin: number;
}

export interface Rock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  spin: number;
  verts: number[];
  hp: number;
}

export type SparkKind = 'engine' | 'shot' | 'enemy' | 'boom' | 'flash' | 'dust';

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  kind: SparkKind;
  size: number;
}

export interface Ring {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  grow: number;
  kind: SparkKind;
}

export interface Star {
  x: number;
  y: number;
  z: number;
  tw: number;
}

export interface Dust {
  x: number;
  y: number;
  r: number;
  a: number;
  vy: number;
}

export interface State {
  w: number;
  h: number;
  t: number;
  rng: Rng;
  ship: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    hp: number;
    fire: number;
    invuln: number;
    alive: boolean;
  };
  aimX: number;
  aimY: number;
  hasAim: boolean;
  bullets: Bullet[];
  enemies: Enemy[];
  rocks: Rock[];
  sparks: Spark[];
  rings: Ring[];
  stars: Star[];
  dust: Dust[];
  planet: { x: number; y: number };
  station: { x: number; y: number };
  score: number;
  spawn: number;
  shake: number;
  over: boolean;
}

export const SHIP_R = 14;
const MAX_HP = 5;
const PAD = 26;

const idle = {
  ax: 0,
  ay: 0,
  aimX: 0,
  aimY: 0,
  hasAim: false,
  steering: false,
  firing: false,
};

const MAX_SPEED = 280;
const STOP_DIST = 22;

export function createState(seed: number): State {
  const rng = mulberry32(seed);
  const stars: Star[] = [];
  for (let i = 0; i < 190; i++) {
    stars.push({ x: rng() * 2 - 1, y: rng() * 2 - 1, z: rng(), tw: rng() * 6 });
  }
  return {
    w: 0,
    h: 0,
    t: 0,
    rng,
    ship: { x: 0, y: 0, vx: 0, vy: 0, angle: -Math.PI / 2, hp: MAX_HP, fire: 0, invuln: 1.6, alive: true },
    aimX: 0,
    aimY: 0,
    hasAim: false,
    bullets: [],
    enemies: [],
    rocks: [],
    sparks: [],
    rings: [],
    stars,
    dust: [],
    planet: { x: 0.78, y: 0.16 },
    station: { x: 0.18, y: 0.22 },
    score: 0,
    spawn: 1.4,
    shake: 0,
    over: false,
  };
}

function makeRock(state: State, fromEdge: boolean): Rock {
  const rng = state.rng;
  const r = 18 + rng() * 26;
  const verts = Array.from({ length: 9 }, () => 0.62 + rng() * 0.38);
  let x = state.w * (0.1 + rng() * 0.8);
  let y = state.h * (0.06 + rng() * 0.34);
  if (fromEdge) {
    x = rng() * state.w;
    y = -r - 8;
  }
  return {
    x,
    y,
    vx: (rng() - 0.5) * 36,
    vy: 12 + rng() * 22,
    r,
    rot: rng() * Math.PI * 2,
    spin: (rng() - 0.5) * 0.9,
    verts,
    hp: r > 32 ? 3 : 2,
  };
}

export function resize(state: State, w: number, h: number): void {
  const first = state.w < 2;
  state.w = w;
  state.h = h;
  if (!first) return;
  state.ship.x = w * 0.5;
  state.ship.y = h * 0.78;
  state.rocks = [];
  for (let i = 0; i < 5; i++) {
    const rock = makeRock(state, false);
    const dx = rock.x - state.ship.x;
    const dy = rock.y - state.ship.y;
    const gap = rock.r + 120;
    if (dx * dx + dy * dy < gap * gap) rock.y = state.h * 0.18;
    state.rocks.push(rock);
  }
  state.dust = [];
  for (let i = 0; i < 14; i++) {
    state.dust.push({
      x: state.rng() * w,
      y: state.rng() * h,
      r: 18 + state.rng() * 40,
      a: 0.04 + state.rng() * 0.06,
      vy: 40 + state.rng() * 70,
    });
  }
}

export function restart(state: State): void {
  const w = state.w;
  const h = state.h;
  const rng = state.rng;
  const stars = state.stars;
  const next = createState(1);
  next.w = w;
  next.h = h;
  next.rng = rng;
  next.stars = stars;
  next.ship.x = w * 0.5;
  next.ship.y = h * 0.78;
  for (let i = 0; i < 5; i++) next.rocks.push(makeRock(next, false));
  for (let i = 0; i < 14; i++) {
    next.dust.push({
      x: rng() * w,
      y: rng() * h,
      r: 18 + rng() * 40,
      a: 0.04 + rng() * 0.06,
      vy: 40 + rng() * 70,
    });
  }
  Object.assign(state, next);
}

function overlap(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
}

function burst(state: State, x: number, y: number, kind: SparkKind, n: number, speed: number, size: number): void {
  for (let i = 0; i < n; i++) {
    const a = state.rng() * Math.PI * 2;
    const s = speed * (0.35 + state.rng());
    state.sparks.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 0.28 + state.rng() * 0.45,
      max: 0.7,
      kind,
      size: size * (0.5 + state.rng()),
    });
  }
  state.rings.push({ x, y, r: 6, life: 0.42, max: 0.42, grow: 150 + speed, kind });
  if (state.sparks.length > 260) state.sparks.splice(0, state.sparks.length - 260);
  if (state.rings.length > 18) state.rings.splice(0, state.rings.length - 18);
}

function hurt(state: State): void {
  const ship = state.ship;
  if (!ship.alive || ship.invuln > 0) return;
  ship.hp -= 1;
  ship.invuln = 1.05;
  state.shake = 12;
  burst(state, ship.x, ship.y, 'enemy', 18, 180, 4);
  if (ship.hp <= 0) {
    ship.alive = false;
    state.over = true;
    ship.vx = 0;
    ship.vy = 0;
    burst(state, ship.x, ship.y, 'boom', 36, 280, 6);
    state.rings.push({ x: ship.x, y: ship.y, r: 10, life: 0.7, max: 0.7, grow: 280, kind: 'boom' });
    state.shake = 18;
  }
}

function spawnEnemy(state: State): void {
  const rng = state.rng;
  const saucer = state.t > 10 && rng() < 0.34;
  if (saucer) {
    const fromLeft = rng() < 0.5;
    state.enemies.push({
      kind: 'saucer',
      x: fromLeft ? -20 : state.w + 20,
      y: 40 + rng() * state.h * 0.45,
      vx: fromLeft ? 50 + rng() * 40 : -(50 + rng() * 40),
      vy: 16 + rng() * 24,
      hp: 3,
      r: 18,
      cooldown: 0.4 + rng() * 0.6,
      spin: rng() * Math.PI * 2,
    });
    return;
  }
  state.enemies.push({
    kind: 'dart',
    x: 30 + rng() * (state.w - 60),
    y: -24,
    vx: 0,
    vy: 90 + rng() * 80,
    hp: 1,
    r: 13,
    cooldown: 0,
    spin: rng() * Math.PI * 2,
  });
}

function decayFx(state: State, dt: number): void {
  for (const s of state.sparks) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.985;
    s.vy *= 0.985;
    s.life -= dt;
  }
  state.sparks = state.sparks.filter((s) => s.life > 0);
  for (const ring of state.rings) {
    ring.life -= dt;
    ring.r += ring.grow * dt;
  }
  state.rings = state.rings.filter((r) => r.life > 0);
  state.shake *= Math.exp(-3.2 * dt);
  if (state.shake < 0.15) state.shake = 0;
  for (const star of state.stars) {
    star.z -= dt * 0.13;
    if (star.z <= 0.02) {
      star.z = 1;
      star.x = state.rng() * 2 - 1;
      star.y = state.rng() * 2 - 1;
    }
  }
  state.planet.y += dt * 0.012;
  if (state.planet.y > 1.35) state.planet.y = -0.35;
  state.station.y += dt * 0.02;
  if (state.station.y > 1.3) state.station.y = -0.3;
  for (const d of state.dust) {
    d.y += d.vy * dt;
    if (d.y - d.r > state.h) d.y = -d.r;
  }
}

export function update(state: State, input: InputState = idle, dt: number): void {
  if (state.w < 2 || state.h < 2) return;
  state.t += dt;
  state.aimX = input.aimX;
  state.aimY = input.aimY;
  state.hasAim = input.hasAim;
  decayFx(state, dt);

  if (state.over) return;

  const ship = state.ship;
  ship.invuln = Math.max(0, ship.invuln - dt);
  ship.fire -= dt;

  let ax = input.ax;
  let ay = input.ay;
  const stick = Math.hypot(ax, ay);
  if (stick > 1) {
    ax /= stick;
    ay /= stick;
  }

  let tx = 0;
  let ty = 0;
  if (input.steering && input.hasAim) {
    const dx = input.aimX - ship.x;
    const dy = input.aimY - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist > STOP_DIST) {
      const ramp = Math.min(1, (dist - STOP_DIST) / 130);
      tx = (dx / dist) * MAX_SPEED * ramp;
      ty = (dy / dist) * MAX_SPEED * ramp;
    }
  } else if (stick > 0) {
    tx = ax * MAX_SPEED;
    ty = ay * MAX_SPEED;
  }

  const follow = 1 - Math.exp(-14 * dt);
  ship.vx += (tx - ship.vx) * follow;
  ship.vy += (ty - ship.vy) * follow;
  if (!tx && !ty && Math.hypot(ship.vx, ship.vy) < 10) {
    ship.vx = 0;
    ship.vy = 0;
  }

  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  if (ship.x < PAD) {
    ship.x = PAD;
    ship.vx = Math.max(0, ship.vx);
  } else if (ship.x > state.w - PAD) {
    ship.x = state.w - PAD;
    ship.vx = Math.min(0, ship.vx);
  }
  if (ship.y < PAD) {
    ship.y = PAD;
    ship.vy = Math.max(0, ship.vy);
  } else if (ship.y > state.h - PAD) {
    ship.y = state.h - PAD;
    ship.vy = Math.min(0, ship.vy);
  }

  let aim = ship.angle;
  const moving = Math.hypot(ship.vx, ship.vy) > 36;
  if (input.steering && moving) {
    aim = Math.atan2(ship.vy, ship.vx);
  } else if (input.hasAim) {
    const dx = input.aimX - ship.x;
    const dy = input.aimY - ship.y;
    if (Math.hypot(dx, dy) > 28) aim = Math.atan2(dy, dx);
  } else if (moving) {
    aim = Math.atan2(ship.vy, ship.vx);
  }
  let turn = aim - ship.angle;
  if (turn > Math.PI) turn -= Math.PI * 2;
  if (turn < -Math.PI) turn += Math.PI * 2;
  ship.angle += turn * Math.min(1, dt * 14);

  const ca = Math.cos(ship.angle);
  const sa = Math.sin(ship.angle);
  const speed = Math.hypot(ship.vx, ship.vy);
  const exhaust = 1 + Math.min(2, speed / 280);
  if (speed > 28) {
    for (let i = 0; i < 2; i++) {
      state.sparks.push({
        x: ship.x - ca * 16 + (state.rng() - 0.5) * 5,
        y: ship.y - sa * 16 + (state.rng() - 0.5) * 5,
        vx: -ca * (70 + speed * 0.25) * exhaust + (state.rng() - 0.5) * 36,
        vy: -sa * (70 + speed * 0.25) * exhaust + (state.rng() - 0.5) * 36,
        life: 0.22 + state.rng() * 0.16,
        max: 0.38,
        kind: 'engine',
        size: 3 + state.rng() * 4,
      });
    }
  }

  if (input.firing && ship.fire <= 0) {
    ship.fire = 0.1;
    const px = -sa;
    const py = ca;
    for (const side of [-1, 1]) {
      state.bullets.push({
        x: ship.x + px * side * 9 + ca * 18,
        y: ship.y + py * side * 9 + sa * 18,
        vx: ca * 780,
        vy: sa * 780,
        friendly: true,
        life: 0.85,
        r: 3.5,
      });
    }
    state.sparks.push({
      x: ship.x + ca * 18,
      y: ship.y + sa * 18,
      vx: ca * 40,
      vy: sa * 40,
      life: 0.06,
      max: 0.06,
      kind: 'flash',
      size: 16,
    });
  }

  for (const e of state.enemies) {
    if (e.kind === 'dart') {
      e.x += Math.sin(state.t * 2.4 + e.spin) * 70 * dt;
      e.y += e.vy * dt;
    } else {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.spin += dt * 1.6;
      e.cooldown -= dt;
      if (e.cooldown <= 0) {
        e.cooldown = 1.45;
        const dx = ship.x - e.x;
        const dy = ship.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        state.bullets.push({
          x: e.x,
          y: e.y,
          vx: (dx / d) * 230,
          vy: (dy / d) * 230,
          friendly: false,
          life: 2.6,
          r: 4,
        });
      }
    }
  }

  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }

  for (const rock of state.rocks) {
    rock.x += rock.vx * dt;
    rock.y += rock.vy * dt;
    rock.rot += rock.spin * dt;
    if (rock.y - rock.r > state.h) {
      rock.y = -rock.r;
      rock.x = state.rng() * state.w;
    }
    if (rock.x < -rock.r) rock.x = state.w + rock.r;
    if (rock.x > state.w + rock.r) rock.x = -rock.r;
  }

  for (const b of state.bullets) {
    if (b.life <= 0) continue;
    if (b.friendly) {
      for (const e of state.enemies) {
        if (e.hp <= 0) continue;
        if (!overlap(b.x, b.y, b.r, e.x, e.y, e.r)) continue;
        e.hp -= 1;
        b.life = 0;
        burst(state, b.x, b.y, 'boom', 6, 120, 3);
        if (e.hp <= 0) {
          state.score += e.kind === 'saucer' ? 250 : 100;
          state.shake = Math.max(state.shake, e.kind === 'saucer' ? 7 : 4);
          burst(state, e.x, e.y, e.kind === 'saucer' ? 'boom' : 'enemy', e.kind === 'saucer' ? 22 : 12, 200, 4);
        }
        break;
      }
      if (b.life <= 0) continue;
      for (const rock of state.rocks) {
        if (rock.hp <= 0) continue;
        if (!overlap(b.x, b.y, b.r, rock.x, rock.y, rock.r * 0.85)) continue;
        rock.hp -= 1;
        b.life = 0;
        burst(state, b.x, b.y, 'dust', 8, 140, 3);
        if (rock.hp <= 0) {
          state.score += 40;
          burst(state, rock.x, rock.y, 'boom', 16, 160, 4);
          state.rocks.push(makeRock(state, true));
        }
        break;
      }
    } else {
      for (const rock of state.rocks) {
        if (rock.hp <= 0) continue;
        if (!overlap(b.x, b.y, b.r, rock.x, rock.y, rock.r * 0.85)) continue;
        b.life = 0;
        break;
      }
      if (b.life > 0 && overlap(b.x, b.y, b.r, ship.x, ship.y, SHIP_R)) {
        b.life = 0;
        hurt(state);
      }
    }
  }

  if (ship.alive) {
    for (const e of state.enemies) {
      if (e.hp <= 0) continue;
      if (!overlap(ship.x, ship.y, SHIP_R, e.x, e.y, e.r)) continue;
      e.hp = 0;
      state.score += e.kind === 'saucer' ? 250 : 100;
      burst(state, e.x, e.y, 'enemy', 14, 180, 4);
      hurt(state);
    }
    for (const rock of state.rocks) {
      if (rock.hp <= 0) continue;
      if (!overlap(ship.x, ship.y, SHIP_R, rock.x, rock.y, rock.r * 0.8)) continue;
      burst(state, ship.x, ship.y, 'boom', 8, 100, 3);
      hurt(state);
    }
  }

  state.bullets = state.bullets.filter(
    (b) => b.life > 0 && b.x > -40 && b.y > -40 && b.x < state.w + 40 && b.y < state.h + 40,
  );
  state.enemies = state.enemies.filter((e) => e.hp > 0 && e.y < state.h + 40 && e.x > -80 && e.x < state.w + 80);
  state.rocks = state.rocks.filter((r) => r.hp > 0);

  state.spawn -= dt;
  if (state.spawn <= 0 && state.enemies.length < 7) {
    const pressure = Math.min(1, state.t / 50);
    state.spawn = 1.2 - pressure * 0.65;
    spawnEnemy(state);
  }
}

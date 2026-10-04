import { mulberry32, randomInt, type Rng } from '../../core/rng';
import type { InputAction } from '../../core/input';

export type DifficultyId = '1' | '2' | '3' | '4' | '5';

export interface Vec {
  r: number;
  c: number;
}

export interface State {
  difficulty: DifficultyId;
  wins: number;
  phase: 'play' | 'done';
  passable: boolean[][];
  player: Vec;
  rival: Vec;
  food: Vec;
  rotation: 0 | 1 | 2 | 3;
  msRotate: number;
  msRival: number;
  winner: 'you' | 'rival' | null;
  rotateEveryMs: number;
  aiSpeedMs: number;
}

const DIRS: Vec[] = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
];

const LEVEL: Record<
  DifficultyId,
  { cells: number; rotateEveryMs: number; aiSpeedMs: number; waitMs: number }
> = {
  '1': { cells: 3, rotateEveryMs: 3200, aiSpeedMs: 1600, waitMs: 1600 },
  '2': { cells: 4, rotateEveryMs: 2600, aiSpeedMs: 1200, waitMs: 1200 },
  '3': { cells: 5, rotateEveryMs: 2000, aiSpeedMs: 900, waitMs: 900 },
  '4': { cells: 6, rotateEveryMs: 1800, aiSpeedMs: 650, waitMs: 500 },
  '5': { cells: 7, rotateEveryMs: 1500, aiSpeedMs: 450, waitMs: 250 },
};

export function asDifficulty(id: string): DifficultyId {
  if (id === '1' || id === '2' || id === '3' || id === '4' || id === '5') return id;
  return '3';
}

function inBounds(size: number, v: Vec): boolean {
  return v.r >= 0 && v.c >= 0 && v.r < size && v.c < size;
}

export function screenDelta(action: InputAction): Vec | null {
  if (action === 'up') return { r: -1, c: 0 };
  if (action === 'down') return { r: 1, c: 0 };
  if (action === 'left') return { r: 0, c: -1 };
  if (action === 'right') return { r: 0, c: 1 };
  return null;
}

export function mapScreenToWorld(delta: Vec, turns: number): Vec {
  const theta = turns * (Math.PI / 2);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const c = delta.c * cos + delta.r * sin;
  const r = -delta.c * sin + delta.r * cos;
  if (Math.abs(r) >= Math.abs(c)) return { r: Math.sign(r) || 0, c: 0 };
  return { r: 0, c: Math.sign(c) || 0 };
}

function generateMaze(cells: number, rng: Rng): boolean[][] {
  const g = cells * 2 - 1;
  const pass = Array.from({ length: g }, () => Array<boolean>(g).fill(false));

  const carve = (r: number, c: number) => {
    pass[r * 2][c * 2] = true;
    const order = [...DIRS];
    for (let i = order.length - 1; i > 0; i--) {
      const j = randomInt(rng, 0, i);
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const d of order) {
      const nr = r + d.r;
      const nc = c + d.c;
      if (nr < 0 || nc < 0 || nr >= cells || nc >= cells || pass[nr * 2][nc * 2]) continue;
      pass[r + nr][c + nc] = true;
      carve(nr, nc);
    }
  };

  carve(0, 0);
  return pass;
}

export function isMazeFullyConnected(passable: boolean[][]): boolean {
  const size = passable.length;
  let open = 0;
  let start: Vec | null = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!passable[r][c]) continue;
      open++;
      start ??= { r, c };
    }
  }
  if (!start || open === size * size) return false;

  const seen = new Set([`${start.r},${start.c}`]);
  const q = [start];
  while (q.length) {
    const cur = q.shift()!;
    for (const d of DIRS) {
      const n = { r: cur.r + d.r, c: cur.c + d.c };
      const k = `${n.r},${n.c}`;
      if (!inBounds(size, n) || !passable[n.r][n.c] || seen.has(k)) continue;
      seen.add(k);
      q.push(n);
    }
  }
  return seen.size === open;
}

function bfsNext(passable: boolean[][], from: Vec, to: Vec): Vec | null {
  if (from.r === to.r && from.c === to.c) return null;
  const size = passable.length;
  const key = (v: Vec) => `${v.r},${v.c}`;
  const prev = new Map<string, Vec | null>([[key(from), null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift()!;
    if (cur.r === to.r && cur.c === to.c) {
      let walk = cur;
      for (;;) {
        const p = prev.get(key(walk));
        if (!p) return null;
        if (p.r === from.r && p.c === from.c) return walk;
        walk = p;
      }
    }
    for (const d of DIRS) {
      const n = { r: cur.r + d.r, c: cur.c + d.c };
      if (!inBounds(size, n) || !passable[n.r][n.c] || prev.has(key(n))) continue;
      prev.set(key(n), cur);
      q.push(n);
    }
  }
  return null;
}

function pathLength(passable: boolean[][], from: Vec, to: Vec): number {
  if (from.r === to.r && from.c === to.c) return 0;
  const size = passable.length;
  const key = (v: Vec) => `${v.r},${v.c}`;
  const dist = new Map<string, number>([[key(from), 0]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift()!;
    const d = dist.get(key(cur))!;
    if (cur.r === to.r && cur.c === to.c) return d;
    for (const dir of DIRS) {
      const n = { r: cur.r + dir.r, c: cur.c + dir.c };
      if (!inBounds(size, n) || !passable[n.r][n.c] || dist.has(key(n))) continue;
      dist.set(key(n), d + 1);
      q.push(n);
    }
  }
  return Infinity;
}

export function newRace(seed: number, difficulty: DifficultyId, wins = 0): State {
  const level = LEVEL[difficulty];
  const minPath = level.cells * 3;
  let passable = generateMaze(level.cells, mulberry32(seed));
  const player = { r: 0, c: 0 };
  let food = { r: passable.length - 1, c: passable.length - 1 };
  for (let n = 1; pathLength(passable, player, food) < minPath && n < 40; n++) {
    passable = generateMaze(level.cells, mulberry32(seed + n * 997));
    food = { r: passable.length - 1, c: passable.length - 1 };
  }
  const you = pathLength(passable, player, food);
  const last = passable.length - 1;
  const starts = [
    { r: 0, c: last },
    { r: last, c: 0 },
  ].sort((a, b) => pathLength(passable, b, food) - pathLength(passable, a, food));
  const rival = starts.find((s) => pathLength(passable, s, food) >= you) ?? starts[0];
  return {
    difficulty,
    wins,
    phase: 'play',
    passable,
    player,
    rival,
    food,
    rotation: 0,
    msRotate: 0,
    msRival: -level.waitMs,
    winner: null,
    rotateEveryMs: level.rotateEveryMs,
    aiSpeedMs: level.aiSpeedMs,
  };
}

function move(state: State, who: 'player' | 'rival', delta: Vec): State {
  const pos = who === 'player' ? state.player : state.rival;
  const next = { r: pos.r + delta.r, c: pos.c + delta.c };
  const size = state.passable.length;
  if (!inBounds(size, next) || !state.passable[next.r][next.c]) return state;
  const updated = who === 'player' ? { ...state, player: next } : { ...state, rival: next };
  if (next.r !== state.food.r || next.c !== state.food.c) return updated;
  return {
    ...updated,
    phase: 'done',
    winner: who === 'player' ? 'you' : 'rival',
    wins: who === 'player' ? state.wins + 1 : 0,
  };
}

export function tick(state: State, dtMs: number): State {
  if (state.phase !== 'play') return state;
  let next: State = {
    ...state,
    msRotate: state.msRotate + dtMs,
    msRival: state.msRival + dtMs,
  };
  if (next.msRotate >= next.rotateEveryMs) {
    next = {
      ...next,
      rotation: ((next.rotation + 1) % 4) as 0 | 1 | 2 | 3,
      msRotate: 0,
    };
  }
  if (next.msRival >= next.aiSpeedMs) {
    const stepTo = bfsNext(next.passable, next.rival, next.food);
    if (stepTo) {
      next = move(next, 'rival', { r: stepTo.r - next.rival.r, c: stepTo.c - next.rival.c });
    }
    if (next.phase === 'play') next = { ...next, msRival: 0 };
  }
  return next;
}

export function step(state: State, action: InputAction): State {
  if (state.phase !== 'play' || action === 'pause') return state;
  const north = screenDelta(action);
  if (!north) return state;
  return move(state, 'player', north);
}

export function stepScreen(state: State, action: InputAction, turns: number): State {
  if (state.phase !== 'play' || action === 'pause') return state;
  const screen = screenDelta(action);
  if (!screen) return state;
  return move(state, 'player', mapScreenToWorld(screen, turns));
}

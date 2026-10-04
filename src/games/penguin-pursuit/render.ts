import type { State, Vec } from './logic';

export interface ThemeColors {
  floor: string;
  wall: string;
  player: string;
  rival: string;
  goal: string;
  accent: string;
}

export interface View {
  turns: number;
  you: Vec;
  them: Vec;
  youFace: Vec;
  themFace: Vec;
}

export function readThemeColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const pick = (name: string) => style.getPropertyValue(name).trim();
  return {
    floor: pick('--floor'),
    wall: pick('--wall'),
    player: pick('--player'),
    rival: pick('--rival'),
    goal: pick('--goal'),
    accent: pick('--accent'),
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function runner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string,
  face: Vec,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, s * 0.32, 0, Math.PI * 2);
  ctx.fill();
  const len = Math.hypot(face.c, face.r) || 1;
  const fx = face.c / len;
  const fy = face.r / len;
  ctx.beginPath();
  ctx.moveTo(x + fx * s * 0.48, y + fy * s * 0.48);
  ctx.lineTo(x - fy * s * 0.14 + fx * s * 0.1, y + fx * s * 0.14 + fy * s * 0.1);
  ctx.lineTo(x + fy * s * 0.14 + fx * s * 0.1, y - fx * s * 0.14 + fy * s * 0.1);
  ctx.fill();
}

function fish(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + s * 0.06, y, s * 0.28, s * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.16, y);
  ctx.lineTo(x - s * 0.42, y - s * 0.22);
  ctx.lineTo(x - s * 0.42, y + s * 0.22);
  ctx.fill();
}

export function createRenderer(canvas: HTMLCanvasElement, colors: ThemeColors) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (state: State, view: View) => {
    const size = state.passable.length;
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const margin = Math.min(w, h) * 0.06;
    const cell = (Math.min(w, h) - margin * 2) / size;
    const ox = (w - cell * size) / 2;
    const oy = (h - cell * size) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = colors.wall;
    roundRect(ctx, margin * 0.3, margin * 0.3, w - margin * 0.6, h - margin * 0.6, 18);
    ctx.fill();

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((view.turns * Math.PI) / 2);
    ctx.translate(-w / 2, -h / 2);

    const bleed = cell * 0.12;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!state.passable[r][c]) continue;
        ctx.fillStyle = colors.floor;
        roundRect(
          ctx,
          ox + c * cell - bleed,
          oy + r * cell - bleed,
          cell + bleed * 2,
          cell + bleed * 2,
          cell * 0.28,
        );
        ctx.fill();
      }
    }

    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.moveTo(w / 2, oy - cell * 0.28);
    ctx.lineTo(w / 2 - cell * 0.16, oy - cell * 0.02);
    ctx.lineTo(w / 2 + cell * 0.16, oy - cell * 0.02);
    ctx.fill();

    const at = (v: Vec) => ({
      x: ox + (v.c + 0.5) * cell,
      y: oy + (v.r + 0.5) * cell,
    });

    const goal = at(state.fish);
    fish(ctx, goal.x, goal.y, cell * 1.15, colors.goal);
    const them = at(view.them);
    runner(ctx, them.x, them.y, cell, colors.rival, view.themFace);
    const you = at(view.you);
    runner(ctx, you.x, you.y, cell, colors.player, view.youFace);
    ctx.restore();
  };

  resize();
  return { resize, draw };
}

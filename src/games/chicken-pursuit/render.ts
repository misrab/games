import type { State, Vec } from './logic';

export interface ThemeColors {
  yard: string;
  path: string;
  pathEdge: string;
  you: string;
  rival: string;
  comb: string;
  beak: string;
  food: string;
  accent: string;
}

export interface View {
  turns: number;
  you: Vec;
  them: Vec;
  youFace: Vec;
  themFace: Vec;
}

export function readThemeColors(el: HTMLElement): ThemeColors {
  const style = getComputedStyle(el);
  const pick = (name: string) => style.getPropertyValue(name).trim();
  return {
    yard: pick('--yard'),
    path: pick('--path'),
    pathEdge: pick('--path-edge'),
    you: pick('--you'),
    rival: pick('--rival-body'),
    comb: pick('--comb'),
    beak: pick('--beak'),
    food: pick('--food'),
    accent: pick('--accent'),
  };
}

function northMark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  angle: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.48, r * 0.42);
  ctx.lineTo(0, r * 0.08);
  ctx.lineTo(-r * 0.48, r * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function chicken(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  body: string,
  comb: string,
  beak: string,
  face: Vec,
) {
  const len = Math.hypot(face.c, face.r) || 1;
  const fx = face.c / len;
  const fy = face.r / len;
  const px = -fy;
  const py = fx;

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.22, s * 0.26, s * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x - fx * s * 0.06, y - fy * s * 0.02, s * 0.26, s * 0.2, Math.atan2(fy, fx), 0, Math.PI * 2);
  ctx.fill();

  const hx = x + fx * s * 0.22;
  const hy = y + fy * s * 0.22 - s * 0.02;
  ctx.beginPath();
  ctx.arc(hx, hy, s * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = comb;
  ctx.beginPath();
  ctx.arc(hx - fx * s * 0.02 - px * s * 0.02, hy - s * 0.14, s * 0.055, 0, Math.PI * 2);
  ctx.arc(hx + px * s * 0.07, hy - s * 0.12, s * 0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = beak;
  ctx.beginPath();
  ctx.moveTo(hx + fx * s * 0.28, hy + fy * s * 0.28);
  ctx.lineTo(hx + fx * s * 0.08 + px * s * 0.07, hy + fy * s * 0.08 + py * s * 0.07);
  ctx.lineTo(hx + fx * s * 0.08 - px * s * 0.07, hy + fy * s * 0.08 - py * s * 0.07);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1c140c';
  ctx.beginPath();
  ctx.arc(hx + fx * s * 0.04 + px * s * 0.05, hy + fy * s * 0.02 + py * s * 0.05, s * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(hx + fx * s * 0.05 + px * s * 0.06, hy + fy * s * 0.01 + py * s * 0.04, s * 0.01, 0, Math.PI * 2);
  ctx.fill();
}

function corn(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.12, s * 0.2, s * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.2, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff4c2';
  for (let row = -1; row <= 1; row++) {
    for (let col = -2; col <= 2; col++) {
      ctx.beginPath();
      ctx.ellipse(col * s * 0.055, row * s * 0.045, s * 0.022, s * 0.016, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
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
    const margin = Math.min(w, h) * 0.07;
    const cell = (Math.min(w, h) - margin * 2) / size;
    const ox = (w - cell * size) / 2;
    const oy = (h - cell * size) / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = colors.yard;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate((view.turns * Math.PI) / 2);
    ctx.translate(-w / 2, -h / 2);

    const paintPaths = (grow: number, color: string) => {
      ctx.fillStyle = color;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (!state.passable[r][c]) continue;
          ctx.fillRect(ox + c * cell - grow, oy + r * cell - grow, cell + grow * 2, cell + grow * 2);
        }
      }
    };

    paintPaths(cell * 0.16, colors.pathEdge);
    paintPaths(cell * 0.05, colors.path);

    const at = (v: Vec) => ({
      x: ox + (v.c + 0.5) * cell,
      y: oy + (v.r + 0.5) * cell,
    });

    const food = at(state.food);
    corn(ctx, food.x, food.y, cell * 1.35, colors.food);
    const them = at(view.them);
    chicken(ctx, them.x, them.y, cell * 1.45, colors.rival, colors.comb, colors.beak, view.themFace);
    const you = at(view.you);
    chicken(ctx, you.x, you.y, cell * 1.45, colors.you, colors.comb, colors.beak, view.youFace);
    ctx.restore();

    const theta = (view.turns * Math.PI) / 2;
    const reach = Math.min(cell * 0.34, margin * 0.46);
    const dist = (cell * size) / 2 + reach;
    northMark(
      ctx,
      w / 2 + Math.sin(theta) * dist,
      h / 2 - Math.cos(theta) * dist,
      reach,
      theta,
      colors.comb,
    );
  };

  resize();
  return { resize, draw };
}

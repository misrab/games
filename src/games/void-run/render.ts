import type { Enemy, Rock, SparkKind, State } from './sim';

export interface ThemeColors {
  space: string;
  nebulaA: string;
  nebulaB: string;
  star: string;
  hull: string;
  hullDark: string;
  hullLit: string;
  cockpit: string;
  engine: string;
  enemy: string;
  rock: string;
  rockLit: string;
  boom: string;
}

interface Sprites {
  engine: HTMLCanvasElement;
  enemy: HTMLCanvasElement;
  boom: HTMLCanvasElement;
  dust: HTMLCanvasElement;
}

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d context missing');
  return ctx;
}

function disc(size: number, inner: string, mid: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = ctx2d(canvas);
  const r = size / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, inner);
  g.addColorStop(0.28, mid);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function makeSprites(colors: ThemeColors): Sprites {
  return {
    engine: disc(128, '#ffffff', colors.engine),
    enemy: disc(128, '#ffffff', colors.enemy),
    boom: disc(128, '#fff6d8', colors.boom),
    dust: disc(128, colors.rockLit, colors.rock),
  };
}

function spriteFor(sprites: Sprites, kind: SparkKind): HTMLCanvasElement {
  if (kind === 'enemy' || kind === 'shot') return sprites.enemy;
  if (kind === 'boom' || kind === 'flash') return sprites.boom;
  if (kind === 'dust') return sprites.dust;
  return sprites.engine;
}

export function readThemeColors(el: HTMLElement): ThemeColors {
  const style = getComputedStyle(el);
  const pick = (name: string) => style.getPropertyValue(name).trim();
  return {
    space: pick('--space'),
    nebulaA: pick('--nebula-a'),
    nebulaB: pick('--nebula-b'),
    star: pick('--star'),
    hull: pick('--hull'),
    hullDark: pick('--hull-dark'),
    hullLit: pick('--hull-lit'),
    cockpit: pick('--cockpit'),
    engine: pick('--engine'),
    enemy: pick('--enemy'),
    rock: pick('--rock'),
    rockLit: pick('--rock-lit'),
    boom: pick('--boom'),
  };
}

function blit(ctx: CanvasRenderingContext2D, sprite: HTMLCanvasElement, x: number, y: number, w: number): void {
  ctx.drawImage(sprite, x - w / 2, y - w / 2, w, w);
}

function smear(src: HTMLCanvasElement, dst: HTMLCanvasElement): void {
  const ctx = ctx2d(dst);
  const w = dst.width;
  const h = dst.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.45;
  ctx.drawImage(src, 0, 0);
  ctx.globalAlpha = 0.16;
  const r = 4;
  ctx.drawImage(src, r, 0);
  ctx.drawImage(src, -r, 0);
  ctx.drawImage(src, 0, r);
  ctx.drawImage(src, 0, -r);
  ctx.drawImage(src, r, r);
  ctx.drawImage(src, -r, -r);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function project(star: { x: number; y: number; z: number }, w: number, h: number, ox: number, oy: number) {
  const depth = 0.12 + star.z;
  const p = 0.62 / depth;
  return {
    x: w * 0.5 + ox + star.x * w * 0.62 * p,
    y: h * 0.4 + oy + star.y * h * 0.62 * p,
    s: Math.max(0.6, (1 - star.z) * 2.6),
    a: Math.min(1, (1 - star.z) * 0.95),
  };
}

function drawNebula(ctx: CanvasRenderingContext2D, state: State, colors: ThemeColors): void {
  const { w, h, t } = state;
  const blobs = [
    { x: w * 0.22 + Math.sin(t * 0.05) * 24, y: h * 0.28, r: Math.max(w, h) * 0.42, c: colors.nebulaA, a: 0.55 },
    { x: w * 0.78, y: h * 0.72 + Math.cos(t * 0.04) * 18, r: Math.max(w, h) * 0.36, c: colors.nebulaB, a: 0.4 },
    { x: w * 0.5, y: h * 0.48, r: Math.max(w, h) * 0.22, c: colors.engine, a: 0.16 },
  ];
  ctx.globalCompositeOperation = 'lighter';
  for (const b of blobs) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, b.c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = b.a;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  glow: CanvasRenderingContext2D,
  sprites: Sprites,
  state: State,
  colors: ThemeColors,
): void {
  const parallaxX = (0.5 - state.ship.x / state.w) * 36;
  const parallaxY = (0.5 - state.ship.y / state.h) * 20;
  const x = state.planet.x * state.w + parallaxX;
  const y = state.planet.y * state.h + parallaxY;
  const r = Math.min(state.w, state.h) * 0.13;
  blit(glow, sprites.engine, x, y, r * 2.5);
  const body = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r);
  body.addColorStop(0, colors.hullLit);
  body.addColorStop(0.42, colors.nebulaA);
  body.addColorStop(1, '#07060c');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = colors.nebulaB;
  for (let i = 0; i < 4; i++) {
    const yy = y - r + ((i * 0.22 + state.t * 0.015) % 1) * r * 2;
    ctx.fillRect(x - r, yy, r * 2, r * 0.07);
  }
  ctx.restore();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = colors.cockpit;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawStation(ctx: CanvasRenderingContext2D, state: State, colors: ThemeColors): void {
  const x = state.station.x * state.w + (0.5 - state.ship.x / state.w) * 18;
  const y = state.station.y * state.h + (0.5 - state.ship.y / state.h) * 10;
  const s = 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = colors.hullDark;
  ctx.fillRect(-s, -s * 0.28, s * 2, s * 0.56);
  ctx.fillRect(-s * 0.16, -s * 1.15, s * 0.32, s * 0.95);
  ctx.beginPath();
  ctx.ellipse(0, -s * 1.2, s * 0.62, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = colors.cockpit;
  for (let i = 0; i < 4; i++) ctx.fillRect(-s + 6 + i * s * 0.42, -2, 3, 2);
  ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, rock: Rock, colors: ThemeColors): void {
  ctx.beginPath();
  for (let i = 0; i < rock.verts.length; i++) {
    const a = rock.rot + (i / rock.verts.length) * Math.PI * 2;
    const rad = rock.r * rock.verts[i];
    const x = rock.x + Math.cos(a) * rad;
    const y = rock.y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = colors.rock;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const light = ctx.createRadialGradient(
    rock.x - rock.r * 0.4,
    rock.y - rock.r * 0.45,
    2,
    rock.x,
    rock.y,
    rock.r,
  );
  light.addColorStop(0, colors.rockLit);
  light.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = light;
  ctx.fillRect(rock.x - rock.r, rock.y - rock.r, rock.r * 2, rock.r * 2);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFighter(
  ctx: CanvasRenderingContext2D,
  glow: CanvasRenderingContext2D,
  sprites: Sprites,
  x: number,
  y: number,
  angle: number,
  colors: ThemeColors,
  alpha: number,
  scale: number,
  hostile: boolean,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;
  const plume = hostile ? sprites.enemy : sprites.engine;
  blit(ctx, plume, -16, 0, 28);
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(2, 7);
  ctx.lineTo(-14, 13);
  ctx.lineTo(-8, 4);
  ctx.lineTo(-18, 3);
  ctx.lineTo(-18, -3);
  ctx.lineTo(-8, -4);
  ctx.lineTo(-14, -13);
  ctx.lineTo(2, -7);
  ctx.closePath();
  const hull = ctx.createLinearGradient(-18, 0, 22, 0);
  hull.addColorStop(0, hostile ? '#4a1822' : colors.hullDark);
  hull.addColorStop(0.55, hostile ? colors.enemy : colors.hull);
  hull.addColorStop(1, colors.hullLit);
  ctx.fillStyle = hull;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();
  ctx.fillStyle = hostile ? '#ffd0d6' : colors.cockpit;
  ctx.beginPath();
  ctx.ellipse(6, 0, 5.5, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hostile ? colors.boom : colors.engine;
  ctx.beginPath();
  ctx.arc(-6, 9, 1.7, 0, Math.PI * 2);
  ctx.arc(-6, -9, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  blit(glow, plume, x - Math.cos(angle) * 16 * scale, y - Math.sin(angle) * 16 * scale, 54 * scale);
}

function drawSaucer(
  ctx: CanvasRenderingContext2D,
  glow: CanvasRenderingContext2D,
  sprites: Sprites,
  e: Enemy,
  colors: ThemeColors,
): void {
  blit(glow, sprites.enemy, e.x, e.y, 70);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = ctx.createLinearGradient(0, -10, 0, 12);
  body.addColorStop(0, colors.hullLit);
  body.addColorStop(0.45, colors.enemy);
  body.addColorStop(1, '#3a1018');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cockpit;
  ctx.beginPath();
  ctx.ellipse(0, -3, 7, 5, 0, Math.PI, 0);
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = e.spin + (i / 5) * Math.PI * 2;
    ctx.fillStyle = i % 2 ? colors.boom : colors.hullLit;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 13, Math.sin(a) * 5, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  glow: CanvasRenderingContext2D,
  sprites: Sprites,
  state: State,
  colors: ThemeColors,
): void {
  const ox = (0.5 - state.ship.x / state.w) * 70;
  const oy = (0.5 - state.ship.y / state.h) * 40;
  ctx.lineCap = 'round';
  for (const star of state.stars) {
    const p = project(star, state.w, state.h, ox, oy);
    const prev = project({ x: star.x, y: star.y, z: Math.min(1, star.z + 0.045) }, state.w, state.h, ox, oy);
    const tw = 0.55 + 0.45 * Math.sin(state.t * (1.4 + star.tw) + star.tw);
    ctx.globalAlpha = p.a * tw;
    ctx.strokeStyle = colors.star;
    ctx.lineWidth = p.s;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (star.z < 0.35) blit(glow, sprites.engine, p.x, p.y, 10 + (0.35 - star.z) * 36);
  }
  ctx.globalAlpha = 1;
}

export function createRenderer(canvas: HTMLCanvasElement, root: HTMLElement): { draw(state: State): void } {
  const colors = readThemeColors(root);
  const sprites = makeSprites(colors);
  const scene = document.createElement('canvas');
  const glow = document.createElement('canvas');
  const glowB = document.createElement('canvas');

  return {
    draw(state: State) {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w < 2 || h < 2 || state.w < 2 || state.h < 2) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round(w * dpr);
      const H = Math.round(h * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
        scene.width = W;
        scene.height = H;
        glow.width = Math.max(2, W >> 2);
        glow.height = Math.max(2, H >> 2);
        glowB.width = glow.width;
        glowB.height = glow.height;
      }

      const ctx = ctx2d(scene);
      const gtx = ctx2d(glow);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gtx.setTransform(glow.width / w, 0, 0, glow.height / h, 0, 0);
      gtx.clearRect(0, 0, w, h);
      gtx.globalCompositeOperation = 'lighter';

      const mag = state.shake;
      const sx = Math.sin(state.t * 73) * mag;
      const sy = Math.cos(state.t * 59) * mag;
      ctx.save();
      ctx.translate(sx, sy);
      gtx.save();
      gtx.translate(sx, sy);

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, colors.space);
      bg.addColorStop(1, '#02030a');
      ctx.fillStyle = bg;
      ctx.fillRect(-20, -20, w + 40, h + 40);
      drawNebula(ctx, state, colors);
      drawPlanet(ctx, gtx, sprites, state, colors);
      drawStation(ctx, state, colors);
      drawStars(ctx, gtx, sprites, state, colors);

      for (const rock of state.rocks) drawRock(ctx, rock, colors);

      ctx.globalAlpha = 1;
      gtx.globalAlpha = 1;
      for (const e of state.enemies) {
        if (e.kind === 'saucer') drawSaucer(ctx, gtx, sprites, e, colors);
        else {
          const weave = Math.cos(state.t * 2.4 + e.spin) * 70;
          const angle = Math.atan2(e.vy, weave);
          drawFighter(ctx, gtx, sprites, e.x, e.y, angle, colors, 1, 0.72, true);
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      for (const s of state.sparks) {
        const a = Math.max(0, s.life / s.max);
        const sprite = spriteFor(sprites, s.kind);
        ctx.globalAlpha = a;
        blit(ctx, sprite, s.x, s.y, s.size * (s.kind === 'flash' ? 2.4 : 1.6));
        gtx.globalAlpha = a;
        blit(gtx, sprite, s.x, s.y, s.size * 4.5);
      }
      for (const b of state.bullets) {
        const sprite = b.friendly ? sprites.engine : sprites.enemy;
        ctx.globalAlpha = 1;
        gtx.globalAlpha = 1;
        blit(ctx, sprite, b.x, b.y, b.friendly ? 16 : 18);
        blit(gtx, sprite, b.x, b.y, b.friendly ? 36 : 40);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      gtx.globalAlpha = 1;

      for (const ring of state.rings) {
        const a = Math.max(0, ring.life / ring.max);
        ctx.strokeStyle = ring.kind === 'enemy' ? colors.enemy : colors.boom;
        ctx.globalAlpha = a * 0.8;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        gtx.strokeStyle = ctx.strokeStyle;
        gtx.globalAlpha = a;
        gtx.lineWidth = 3;
        gtx.beginPath();
        gtx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        gtx.stroke();
      }
      ctx.globalAlpha = 1;
      gtx.globalAlpha = 1;

      ctx.globalAlpha = 1;
      gtx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (state.ship.alive) {
        const pulse = state.ship.invuln > 0 ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(state.t * 28)) : 1;
        drawFighter(ctx, gtx, sprites, state.ship.x, state.ship.y, state.ship.angle, colors, pulse, 1.35, false);
      }

      if (state.hasAim && !state.over) {
        const dx = state.aimX - state.ship.x;
        const dy = state.aimY - state.ship.y;
        if (Math.hypot(dx, dy) > 22) {
          ctx.strokeStyle = colors.star;
          ctx.globalAlpha = 0.8;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.arc(state.aimX, state.aimY, 9, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      ctx.globalCompositeOperation = 'lighter';
      for (const d of state.dust) {
        ctx.globalAlpha = d.a;
        blit(ctx, sprites.dust, d.x, d.y, d.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      ctx.restore();
      gtx.restore();

      smear(glow, glowB);
      smear(glowB, glow);

      const out = ctx2d(canvas);
      out.setTransform(1, 0, 0, 1, 0, 0);
      out.clearRect(0, 0, W, H);
      out.drawImage(scene, 0, 0);
      out.globalCompositeOperation = 'lighter';
      out.drawImage(glow, 0, 0, W, H);
      out.globalCompositeOperation = 'source-over';
      out.setTransform(dpr, 0, 0, dpr, 0, 0);
      const vignette = out.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.62)');
      out.fillStyle = vignette;
      out.fillRect(0, 0, w, h);
    },
  };
}

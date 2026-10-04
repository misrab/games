import type { Game } from '../../core/game';
import { bindInput, type InputAction } from '../../core/input';
import { t } from '../../core/i18n';
import { createLoop } from '../../core/loop';
import { saveRun } from '../../core/storage';
import { asDifficulty, newRace, step, tick, type State, type Vec } from './logic';
import { createRenderer, readThemeColors } from './render';
import './style.css';

let stop: (() => void) | null = null;

function shortestTurn(from: number, to: number): number {
  let d = to - from;
  if (d > 2) d -= 4;
  if (d < -2) d += 4;
  return d;
}

function chase(pos: Vec, target: Vec, dt: number): Vec {
  if (Math.hypot(target.r - pos.r, target.c - pos.c) > 1.5) return { ...target };
  const k = Math.min(1, dt * 10);
  return { r: pos.r + (target.r - pos.r) * k, c: pos.c + (target.c - pos.c) * k };
}

function faceBetween(from: Vec, to: Vec, prev: Vec): Vec {
  if (from.r === to.r && from.c === to.c) return prev;
  return { r: Math.sign(to.r - from.r), c: Math.sign(to.c - from.c) };
}

const game: Game = {
  mount(el, opts) {
    const difficulty = asDifficulty(opts.settings.pace ?? 'normal');
    let state: State = newRace(Date.now() & 0xffff, difficulty);
    let shown = state.rotation;
    let you = { ...state.player };
    let them = { ...state.rival };
    let youFace: Vec = { r: 1, c: 0 };
    let themFace: Vec = { r: 0, c: -1 };
    let saved = false;
    let announced = false;

    el.innerHTML = `
      <section class="ch">
        <div class="ch__meta">
          <p class="ch__legend">
            <span class="ch__key ch__key--you">${t('chicken.you')}</span>
            <span class="ch__key ch__key--rival">${t('chicken.rival')}</span>
            <span class="ch__key ch__key--food">${t('chicken.food')}</span>
          </p>
          <span class="ch__streak" data-streak>${t('chicken.streak', { n: state.wins })}</span>
        </div>
        <div class="ch__turn" aria-hidden="true">
          <span>${t('chicken.turn')}</span>
          <i><b data-spin></b></i>
        </div>
        <div class="ch__main">
          <div class="ch__stage">
            <div class="ch__board">
              <canvas data-canvas></canvas>
              <div class="ch__banner" data-banner hidden></div>
            </div>
          </div>
          <div class="ch__pad">
            <button type="button" data-dir="up" aria-label="${t('dir.up')}">↑</button>
            <button type="button" data-dir="left" aria-label="${t('dir.left')}">←</button>
            <button type="button" data-dir="down" aria-label="${t('dir.down')}">↓</button>
            <button type="button" data-dir="right" aria-label="${t('dir.right')}">→</button>
          </div>
        </div>
      </section>
    `;

    const root = el.querySelector('.ch') as HTMLElement;
    const canvas = el.querySelector('[data-canvas]') as HTMLCanvasElement;
    const banner = el.querySelector('[data-banner]') as HTMLElement;
    const spinEl = el.querySelector('[data-spin]') as HTMLElement;
    const streakEl = el.querySelector('[data-streak]') as HTMLElement;
    const renderer = createRenderer(canvas, readThemeColors(root));

    const paintBanner = () => {
      if (state.phase !== 'done') {
        banner.hidden = true;
        return;
      }
      if (!saved && state.winner) {
        saveRun(opts.gameId, state.wins);
        saved = true;
        streakEl.textContent = t('chicken.streak', { n: state.wins });
      }
      banner.hidden = false;
      banner.innerHTML = `
        <p>${state.winner === 'you' ? t('chicken.win') : t('chicken.lose')}</p>
        <button type="button" data-again>${t('chicken.again')}</button>
      `;
      banner.querySelector('[data-again]')?.addEventListener('click', restart);
    };

    const restart = () => {
      saved = false;
      announced = false;
      state = newRace((Date.now() & 0xffff) ^ 0x9e37, difficulty, state.wins);
      shown = state.rotation;
      you = { ...state.player };
      them = { ...state.rival };
      youFace = { r: 1, c: 0 };
      themFace = { r: 0, c: -1 };
      streakEl.textContent = t('chicken.streak', { n: state.wins });
      paintBanner();
    };

    const onAction = (action: InputAction) => {
      const before = state.player;
      state = step(state, action);
      youFace = faceBetween(before, state.player, youFace);
      paintBanner();
    };

    const onKey = (event: KeyboardEvent) => {
      if (state.phase !== 'done') return;
      if (event.key !== ' ' && event.key !== 'Enter') return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest('button, a, input, textarea, summary') &&
        !target.closest('[data-again]')
      ) {
        return;
      }
      event.preventDefault();
      restart();
    };

    const unbind = bindInput({ onAction });
    window.addEventListener('keydown', onKey);
    el.querySelectorAll('[data-dir]').forEach((btn) => {
      btn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        onAction((btn as HTMLElement).dataset.dir as InputAction);
      });
    });
    canvas.addEventListener('pointerdown', (event) => {
      if (state.phase !== 'play') return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const size = state.passable.length;
      const margin = Math.min(w, h) * 0.07;
      const cell = (Math.min(w, h) - margin * 2) / size;
      const ox = (w - cell * size) / 2;
      const oy = (h - cell * size) / 2;
      const lx = ox + (you.c + 0.5) * cell - w / 2;
      const ly = oy + (you.r + 0.5) * cell - h / 2;
      const ang = shown * (Math.PI / 2);
      const sx = w / 2 + lx * Math.cos(ang) - ly * Math.sin(ang);
      const sy = h / 2 + lx * Math.sin(ang) + ly * Math.cos(ang);
      const mx = event.clientX - rect.left - sx;
      const my = event.clientY - rect.top - sy;
      if (Math.hypot(mx, my) < 10) return;
      const horizontal: InputAction = mx > 0 ? 'right' : 'left';
      const vertical: InputAction = my > 0 ? 'down' : 'up';
      const order = Math.abs(mx) > Math.abs(my) ? [horizontal, vertical] : [vertical, horizontal];
      for (const action of order) {
        const next = step(state, action);
        if (next !== state) {
          onAction(action);
          return;
        }
      }
    });

    const onResize = () => renderer.resize();
    const observer = new ResizeObserver(onResize);
    observer.observe(canvas);
    window.addEventListener('resize', onResize);

    const loop = createLoop({
      update(dt) {
        const beforeRot = state.rotation;
        const beforeThem = state.rival;
        state = tick(state, dt * 1000);
        themFace = faceBetween(beforeThem, state.rival, themFace);
        if (state.rotation !== beforeRot) shown = beforeRot;
        const goal = state.rotation;
        const delta = shortestTurn(shown, goal);
        shown += Math.sign(delta) * Math.min(Math.abs(delta), dt * 2.2);
        if (Math.abs(shortestTurn(shown, goal)) < 0.02) shown = goal;
        you = chase(you, state.player, dt);
        them = chase(them, state.rival, dt);
        const spin = state.rotateEveryMs ? Math.max(0, state.msRotate) / state.rotateEveryMs : 0;
        spinEl.style.width = `${Math.min(100, spin * 100)}%`;
        spinEl.classList.toggle('is-soon', spin > 0.75);
        if (state.phase === 'done' && !announced) {
          announced = true;
          paintBanner();
        }
      },
      render() {
        renderer.draw(state, { turns: shown, you, them, youFace, themFace });
      },
    });
    loop.start();

    stop = () => {
      loop.stop();
      unbind();
      window.removeEventListener('keydown', onKey);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      el.replaceChildren();
    };
  },

  unmount() {
    stop?.();
    stop = null;
  },
};

export default game;

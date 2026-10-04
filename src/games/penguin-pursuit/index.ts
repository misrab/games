import type { Game } from '../../core/game';
import { bindInput, type InputAction } from '../../core/input';
import { t } from '../../core/i18n';
import { createLoop } from '../../core/loop';
import { getGameStats, saveRun } from '../../core/storage';
import { newRace, nextLevel, step, tick, type State, type Vec } from './logic';
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
    const stats = getGameStats(opts.gameId);
    let state: State = newRace(Date.now() & 0xffff, stats.level);
    let shown = state.rotation;
    let you = { ...state.player };
    let them = { ...state.rival };
    let youFace: Vec = { r: 1, c: 0 };
    let themFace: Vec = { r: 0, c: -1 };
    let saved = false;
    let announced = false;

    el.innerHTML = `
      <section class="pp">
        <header class="pp__bar">
          <button type="button" class="pp__back" data-back>${t('penguin.back')}</button>
          <h1>${t('penguin.title')}</h1>
          <span data-level>${t('penguin.level', { level: state.level })}</span>
        </header>
        <p class="pp__legend">
          <span class="pp__key pp__key--you">${t('penguin.you')}</span>
          <span class="pp__key pp__key--rival">${t('penguin.rival')}</span>
          <span class="pp__key pp__key--fish">${t('penguin.fish')}</span>
        </p>
        <div class="pp__spin" aria-hidden="true"><span data-spin></span></div>
        <div class="pp__main">
          <div class="pp__stage">
            <div class="pp__board">
              <canvas data-canvas></canvas>
              <div class="pp__banner" data-banner hidden></div>
            </div>
          </div>
          <div class="pp__controls">
            <p class="pp__hint">${t('penguin.hint')}</p>
            <div class="pp__pad">
              <button type="button" data-dir="up" aria-label="${t('penguin.you')} up">↑</button>
              <button type="button" data-dir="left" aria-label="left">←</button>
              <button type="button" data-dir="down" aria-label="down">↓</button>
              <button type="button" data-dir="right" aria-label="right">→</button>
            </div>
          </div>
        </div>
      </section>
    `;

    const canvas = el.querySelector('[data-canvas]') as HTMLCanvasElement;
    const levelEl = el.querySelector('[data-level]') as HTMLElement;
    const banner = el.querySelector('[data-banner]') as HTMLElement;
    const spinEl = el.querySelector('[data-spin]') as HTMLElement;
    const renderer = createRenderer(canvas, readThemeColors());

    const paintBanner = () => {
      if (state.phase !== 'done') {
        banner.hidden = true;
        return;
      }
      if (!saved && state.winner) {
        const level = nextLevel(state.level, state.winner === 'you');
        saveRun(opts.gameId, state.winner === 'you' ? state.level : 0, level);
        state = { ...state, level };
        saved = true;
      }
      banner.hidden = false;
      banner.innerHTML = `
        <p>${state.winner === 'you' ? t('penguin.win') : t('penguin.lose')}</p>
        <button type="button" data-again>${t('penguin.again')}</button>
      `;
      banner.querySelector('[data-again]')?.addEventListener('click', restart);
    };

    const restart = () => {
      saved = false;
      announced = false;
      state = newRace((Date.now() & 0xffff) ^ 0x9e37, state.level, state.wins);
      shown = state.rotation;
      you = { ...state.player };
      them = { ...state.rival };
      youFace = { r: 1, c: 0 };
      themFace = { r: 0, c: -1 };
      levelEl.textContent = t('penguin.level', { level: state.level });
      paintBanner();
    };

    const onAction = (action: InputAction) => {
      const before = state.player;
      state = step(state, action);
      youFace = faceBetween(before, state.player, youFace);
      paintBanner();
    };

    const unbind = bindInput({ onAction });
    el.querySelector('[data-back]')?.addEventListener('click', () => {
      location.hash = '#/';
    });
    el.querySelectorAll('[data-dir]').forEach((btn) => {
      btn.addEventListener('click', () => onAction((btn as HTMLElement).dataset.dir as InputAction));
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
        renderer.draw(state, {
          turns: shown,
          you,
          them,
          youFace,
          themFace,
        });
      },
    });
    loop.start();

    stop = () => {
      loop.stop();
      unbind();
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

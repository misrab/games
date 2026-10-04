import type { Game } from '../../core/game';
import { t } from '../../core/i18n';
import { createLoop } from '../../core/loop';
import { saveRun } from '../../core/storage';
import { createRenderer } from './render';
import { createState, pointerIntent, restart, resize, update, type InputState, type LivePointer } from './sim';
import './style.css';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    const state = createState(Date.now() & 0xffff);
    const keys = new Set<string>();
    const pointers = new Map<number, LivePointer & { ox: number; oy: number }>();
    let stickId: number | null = null;
    let armed = true;
    let saved = false;

    el.innerHTML = `
      <section class="void">
        <canvas data-canvas></canvas>
        <div class="void__hud">
          <span data-score></span>
          <span data-hull></span>
        </div>
        <div class="void__over">
          <p>${t('void.over')}</p>
          <button type="button" data-again>${t('void.again')}</button>
        </div>
      </section>
    `;

    const root = el.querySelector('.void') as HTMLElement;
    const canvas = el.querySelector('[data-canvas]') as HTMLCanvasElement;
    const scoreEl = el.querySelector('[data-score]') as HTMLElement;
    const hullEl = el.querySelector('[data-hull]') as HTMLElement;
    const overEl = el.querySelector('.void__over') as HTMLElement;
    const renderer = createRenderer(canvas, root);

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      resize(state, rect.width, rect.height);
    };

    const readInput = (): InputState => {
      let ax = 0;
      let ay = 0;
      if (keys.has('arrowright') || keys.has('d')) ax += 1;
      if (keys.has('arrowleft') || keys.has('a')) ax -= 1;
      if (keys.has('arrowdown') || keys.has('s')) ay += 1;
      if (keys.has('arrowup') || keys.has('w')) ay -= 1;
      const touch = pointerIntent([...pointers.values()], stickId);
      return {
        ax,
        ay,
        aimX: touch.aimX,
        aimY: touch.aimY,
        hasAim: touch.hasAim,
        steering: touch.steering,
        firing: touch.firing || keys.has(' '),
      };
    };

    const goAgain = () => {
      restart(state);
      saved = false;
      overEl.classList.remove('is-on');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('button, a, input, textarea')) return;
      const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
      if (!['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(key)) return;
      e.preventDefault();
      keys.add(key);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.delete(key === ' ' ? ' ' : key);
    };

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const p = local(e);
      pointers.set(e.pointerId, { id: e.pointerId, x: p.x, y: p.y, ox: p.x, oy: p.y });
    };

    const onMove = (e: PointerEvent) => {
      const cur = pointers.get(e.pointerId);
      if (!cur) return;
      const p = local(e);
      cur.x = p.x;
      cur.y = p.y;
      if (stickId != null) return;
      const dx = cur.x - cur.ox;
      const dy = cur.y - cur.oy;
      if (dx * dx + dy * dy > 14 * 14) stickId = cur.id;
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (stickId === e.pointerId) stickId = null;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    };

    const onAgain = () => goAgain();

    const onVis = () => {
      if (!document.hidden) return;
      keys.clear();
      pointers.clear();
      stickId = null;
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    root.querySelector('[data-again]')?.addEventListener('click', onAgain);
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    fit();

    const loop = createLoop({
      update(dt) {
        const input = readInput();
        const held = input.firing;
        if (state.over) {
          if (!saved) {
            saved = true;
            armed = false;
            saveRun(opts.gameId, state.score);
          }
          if (!held) armed = true;
          if (armed && held) {
            goAgain();
            return;
          }
          update(state, { ...input, firing: false }, dt);
          overEl.classList.add('is-on');
          return;
        }
        if (!held) armed = true;
        update(state, input, dt);
      },
      render() {
        renderer.draw(state);
        scoreEl.textContent = t('void.score', { score: state.score });
        hullEl.textContent = t('void.hull', { hp: Math.max(0, state.ship.hp) });
      },
    });
    loop.start();

    stop = () => {
      loop.stop();
      observer.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      el.replaceChildren();
    };
  },

  unmount() {
    stop?.();
    stop = null;
  },
};

export default game;

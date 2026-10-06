import '../../../bias/kit/styles.css';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { meanError, planningError } from './logic';

type Step = 'intro' | 'estimate' | 'task' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let estimate = 10;
    let actual = 0;
    let errors: number[] = [];
    let taps = 0;
    let t0 = 0;
    let timer: number | null = null;
    const tasks = [
      { id: 'drum', target: 6 },
      { id: 'sprint', target: 12 },
      { id: 'march', target: 9 },
      { id: 'clap', target: 15 },
      { id: 'stamp', target: 7 },
      { id: 'knock', target: 11 },
    ];
    const task = () => tasks[round];

    const { card, unmount } = mountCard(el);

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('planning', 'sub.play', 'plan.intro', t('sub.plan.controls.desktop'), t('sub.plan.controls.touch'));
      if (step === 'tip') return tipBlock('plan.tip.title', 'plan.tip.body');
      if (step === 'done') {
        return saveAndDoneHtml(opts.gameId, 'planning', meanError(errors.slice(0, 3)), meanError(errors.slice(3)));
      }
      if (step === 'reveal')
        return `
          <p class="bk__verdict">${t('plan.reveal', { estimate, actual })}</p>
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      if (step === 'task')
        return `
          <p class="bk__q">${t(`plan.task.${task().id}`, { n: taps, target: task().target })}</p>
          <button type="button" class="bk__btn" data-act="tap" data-focus>${t('plan.tap')}</button>`;
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t(`plan.name.${task().id}`, { target: task().target })}</h2>
        <input type="number" class="bk__btn" data-est value="10" min="3" max="60" aria-label="${t('plan.estimate')}" />
        <button type="button" class="bk__btn" data-act="go" data-focus>${t('sub.continue')}</button>`;
    };

    const clearTimer = () => {
      if (timer != null) window.clearInterval(timer);
      timer = null;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!btn) return;
      switch (btn.dataset.act) {
        case 'start':
          step = 'estimate';
          round = 0;
          errors = [];
          paint();
          break;
        case 'go':
          estimate = Number((card.querySelector('[data-est]') as HTMLInputElement).value) || 10;
          taps = 0;
          t0 = performance.now();
          step = 'task';
          paint();
          break;
        case 'tap':
          taps += 1;
          if (taps >= task().target) {
            actual = Math.max(1, Math.round((performance.now() - t0) / 1000));
            errors.push(planningError(estimate, actual));
            step = 'reveal';
          }
          paint();
          break;
        case 'next':
          round += 1;
          { const next = stepAfterRound(round); step = next === 'play' ? 'estimate' : next; }
          paint();
          break;
        case 'tip':
          step = 'estimate';
          paint();
          break;
        case 'again':
          step = 'intro';
          paint();
          break;
      }
    };

    card.addEventListener('click', onClick);
    paint();
    stop = () => {
      clearTimer();
      card.removeEventListener('click', onClick);
      unmount();
    };
  },
  unmount() {
    stop?.();
    stop = null;
  },
};

export default game;

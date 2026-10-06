import '../../../bias/kit/styles.css';
import { gridHtml } from '../../../bias/kit/html';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { biasFromGuess, cases } from './logic';

type Step = 'intro' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let guesses: number[] = [];
    const item = () => cases[round];

    const { card, unmount } = mountCard(el);

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('representativeness', 'sub.play', 'rep.intro', t('sub.rep.controls.desktop'), t('sub.rep.controls.touch'));
      if (step === 'tip') return tipBlock('rep.tip.title', 'rep.tip.body');
      if (step === 'done') {
        const before = Math.round(guesses.slice(0, 3).reduce((s, g, i) => s + biasFromGuess(g, cases[i].truth), 0) / 3);
        const after = Math.round(guesses.slice(3).reduce((s, g, i) => s + biasFromGuess(g, cases[i + 3].truth), 0) / 3);
        return saveAndDoneHtml(opts.gameId, 'representativeness', before, after);
      }
      if (step === 'reveal') {
        const c = cases[round];
        return `
          <p class="bk__verdict">${t('rep.reveal', { truth: c.truth, guess: guesses[guesses.length - 1] })}</p>
          ${gridHtml(c.truth)}
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      }
      const c = item();
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t(`rep.q.${c.id}`)}</h2>
        <div class="bk__stack">
          ${c.options.map((pct, i) => `<button type="button" class="bk__btn" data-pct="${pct}" ${i === 0 ? 'data-focus' : ''}>${pct}%</button>`).join('')}
        </div>`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act],[data-pct]') as HTMLElement | null;
      if (!btn) return;
      if (btn.dataset.pct) {
        guesses.push(Number(btn.dataset.pct));
        step = 'reveal';
        paint();
        return;
      }
      switch (btn.dataset.act) {
        case 'start':
          step = 'play';
          round = 0;
          guesses = [];
          paint();
          break;
        case 'next':
          round += 1;
          step = stepAfterRound(round);
          paint();
          break;
        case 'tip':
          step = 'play';
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

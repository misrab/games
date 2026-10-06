import '../../../bias/kit/styles.css';
import { gridHtml } from '../../../bias/kit/html';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { biasFromGuess, taxiBlueRate } from './logic';

type Step = 'intro' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let guesses: number[] = [];
    const truth = Math.round(taxiBlueRate() * 100);

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
        return saveAndDoneHtml(opts.gameId, 'representativeness', Math.round(guesses.slice(0, 3).reduce((s, g) => s + biasFromGuess(g, truth), 0) / 3), Math.round(guesses.slice(3).reduce((s, g) => s + biasFromGuess(g, truth), 0) / 3));
      }
      if (step === 'reveal')
        return `
          <p class="bk__verdict">${t('rep.reveal', { truth, guess: guesses[guesses.length - 1] })}</p>
          ${gridHtml(truth)}
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t('rep.question')}</h2>
        <div class="bk__row">
          <button type="button" class="bk__btn" data-pct="70">70%</button>
          <button type="button" class="bk__btn" data-pct="41" data-focus>41%</button>
          <button type="button" class="bk__btn" data-pct="15">15%</button>
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

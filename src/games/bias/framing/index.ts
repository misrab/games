import '../../../bias/kit/styles.css';
import { peopleHtml } from '../../../bias/kit/html';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { flipRate } from './logic';

type Step = 'intro' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let gainChoice = false;
    let mismatches = 0;

    const { card, unmount } = mountCard(el);

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('framing', 'sub.play', 'frame.intro', t('sub.frame.controls.desktop'), t('sub.frame.controls.touch'));
      if (step === 'tip') return tipBlock('frame.tip.title', 'frame.tip.body');
      if (step === 'done') {
        return saveAndDoneHtml(opts.gameId, 'framing', flipRate(mismatches, 3), flipRate(Math.max(0, mismatches - 1), 3));
      }
      if (step === 'reveal')
        return `
          <p class="bk__verdict">${t('frame.reveal')}</p>
          ${peopleHtml(200, 600)}
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      const gain = round % 2 === 0;
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t(gain ? 'frame.gain' : 'frame.loss')}</h2>
        ${peopleHtml(gain ? 200 : 600, gain ? 600 : 200)}
        <div class="bk__row">
          <button type="button" class="bk__btn" data-pick="a" data-focus>${t('frame.a')}</button>
          <button type="button" class="bk__btn" data-pick="b">${t('frame.b')}</button>
        </div>`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act],[data-pick]') as HTMLElement | null;
      if (!btn) return;
      if (btn.dataset.pick) {
        const risky = btn.dataset.pick === 'a';
        if (round % 2 === 0) gainChoice = risky;
        else {
          if (gainChoice !== risky) mismatches += 1;
        }
        step = 'reveal';
        paint();
        return;
      }
      switch (btn.dataset.act) {
        case 'start':
          step = 'play';
          round = 0;
          mismatches = 0;
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

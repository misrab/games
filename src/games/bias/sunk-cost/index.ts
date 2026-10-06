import '../../../bias/kit/styles.css';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { shouldLeave, sunkBias, type Mine } from './logic';

type Step = 'intro' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let mine: Mine = { gold: 100, dug: 0, costPerDig: 10 };
    let log: { dig: boolean; shouldLeave: boolean }[] = [];

    const { card, unmount } = mountCard(el);

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('sunk', 'sub.play', 'sunk.intro', t('sub.sunk.controls.desktop'), t('sub.sunk.controls.touch'));
      if (step === 'tip') return tipBlock('sunk.tip.title', 'sunk.tip.body');
      if (step === 'done') {
        return saveAndDoneHtml(opts.gameId, 'sunk', sunkBias(log.slice(0, 3)), sunkBias(log.slice(3)));
      }
      if (step === 'reveal')
        return `
          <p class="bk__verdict">${t('sunk.reveal')}</p>
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <p class="bk__note">${t('sunk.state', { dug: mine.dug, left: Math.max(0, mine.gold - mine.dug * mine.costPerDig) })}</p>
        <div class="bk__row">
          <button type="button" class="bk__btn" data-act="dig" data-focus>${t('sunk.dig')}</button>
          <button type="button" class="bk__btn" data-act="leave">${t('sunk.leave')}</button>
        </div>`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!btn) return;
      switch (btn.dataset.act) {
        case 'start':
          step = 'play';
          round = 0;
          log = [];
          mine = { gold: 80, dug: 0, costPerDig: 10 };
          paint();
          break;
        case 'dig':
          mine = { ...mine, dug: mine.dug + 1 };
          log.push({ dig: true, shouldLeave: shouldLeave(mine) });
          step = 'reveal';
          paint();
          break;
        case 'leave':
          log.push({ dig: false, shouldLeave: shouldLeave(mine) });
          step = 'reveal';
          paint();
          break;
        case 'next':
          round += 1;
          mine = { gold: 70 + round * 5, dug: 4, costPerDig: 10 };
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

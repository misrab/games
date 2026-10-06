import '../../../bias/kit/styles.css';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { acceptRate, type Bet } from './logic';

type Step = 'intro' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const bets: Bet[] = [
  { win: 15, lose: 10 },
  { win: 25, lose: 10 },
  { win: 40, lose: 10 },
  { win: 20, lose: 10 },
  { win: 30, lose: 10 },
  { win: 50, lose: 10 },
];

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let accepts: boolean[] = [];

    const { card, unmount } = mountCard(el);
    const bet = () => bets[round % bets.length];

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('loss', 'sub.play', 'loss.intro', t('sub.loss.controls.desktop'), t('sub.loss.controls.touch'));
      if (step === 'tip') return tipBlock('loss.tip.title', 'loss.tip.body');
      if (step === 'done') {
        const before = acceptRate(accepts.slice(0, 3));
        const after = acceptRate(accepts.slice(3));
        return saveAndDoneHtml(opts.gameId, 'loss', before, after, `<p class="bk__verdict">${t('loss.lambda')}</p>`);
      }
      if (step === 'reveal')
        return `
          <div class="bk__coin is-flip">50</div>
          <p class="bk__verdict">${t('loss.reveal')}</p>
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      const b = bet();
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t('loss.offer', { win: b.win, lose: b.lose })}</h2>
        <div class="bk__row">
          <button type="button" class="bk__btn" data-pick="yes" data-focus>${t('loss.yes')}</button>
          <button type="button" class="bk__btn" data-pick="no">${t('loss.no')}</button>
        </div>`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act],[data-pick]') as HTMLElement | null;
      if (!btn) return;
      if (btn.dataset.pick) {
        accepts.push(btn.dataset.pick === 'yes');
        step = 'reveal';
        paint();
        return;
      }
      switch (btn.dataset.act) {
        case 'start':
          step = 'play';
          round = 0;
          accepts = [];
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

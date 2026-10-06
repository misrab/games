import '../../../bias/kit/styles.css';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { correctPick, errorRate, pairs } from './logic';

type Step = 'intro' | 'feed' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let results: { correct: boolean }[] = [];

    const { card, unmount } = mountCard(el);
    const pair = () => pairs[round % pairs.length];

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('availability', 'sub.play', 'avail.intro', t('sub.avail.controls.desktop'), t('sub.avail.controls.touch'));
      if (step === 'tip') return tipBlock('avail.tip.title', 'avail.tip.body');
      if (step === 'done') {
        return saveAndDoneHtml(opts.gameId, 'availability', errorRate(results.slice(0, 3)), errorRate(results.slice(3)));
      }
      if (step === 'feed')
        return `
          <p class="bk__seen">${t(`avail.headline.${pair().id}`)}</p>
          <button type="button" class="bk__btn" data-act="feed" data-focus>${t('sub.continue')}</button>`;
      if (step === 'reveal') {
        const p = pair();
        const ok = results[results.length - 1].correct;
        return `
          <p class="bk__verdict">${t('avail.reveal', { a: p.a, b: p.b, ok: ok ? t('avail.ok') : t('avail.no') })}</p>
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      }
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t(`avail.q.${pair().id}`)}</h2>
        <div class="bk__row">
          <button type="button" class="bk__btn" data-pick="a" data-focus>${t('avail.a')}</button>
          <button type="button" class="bk__btn" data-pick="b">${t('avail.b')}</button>
        </div>`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act],[data-pick]') as HTMLElement | null;
      if (!btn) return;
      if (btn.dataset.pick) {
        const ok = correctPick(pair(), btn.dataset.pick as 'a' | 'b');
        results.push({ correct: ok });
        step = 'reveal';
        paint();
        return;
      }
      switch (btn.dataset.act) {
        case 'start':
          step = 'play';
          round = 0;
          results = [];
          if (pair().vivid) step = 'feed';
          paint();
          break;
        case 'feed':
          step = 'play';
          paint();
          break;
        case 'next':
          round += 1;
          step = stepAfterRound(round);
          if (step === 'play') step = pair().vivid && round < 3 ? 'feed' : 'play';
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

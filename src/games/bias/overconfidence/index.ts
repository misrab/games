import '../../../bias/kit/styles.css';
import { gridHtml } from '../../../bias/kit/html';
import { bindSlider, fmtNum, readSlider, sliderHtml } from '../../../bias/kit/slider';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { inRange, items, overconfidenceRate } from './logic';

type Step = 'intro' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let i = 0;
    let hits: boolean[] = [];
    let low = 0;
    let high = 0;

    const { card, unmount } = mountCard(el);
    const item = () => items[i % items.length];

    const paint = () => {
      card.innerHTML = view();
      bindSlider(card, item().min, item().max, t('anchor.unset'));
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('overconfidence', 'sub.play', 'over.intro', t('sub.over.controls.desktop'), t('sub.over.controls.touch'));
      if (step === 'tip') return tipBlock('over.tip.title', 'over.tip.body');
      if (step === 'done') {
        const before = overconfidenceRate(hits.slice(0, 3).filter(Boolean).length, 3);
        const after = overconfidenceRate(hits.slice(3).filter(Boolean).length, 3);
        return saveAndDoneHtml(opts.gameId, 'overconfidence', before, after, `<p class="bk__verdict">${t('over.calibration')}</p>`);
      }
      if (step === 'reveal') {
        const it = item();
        const hit = inRange(low, high, it.truth);
        hits.push(hit);
        return `
          <p class="bk__round">${roundLabel(i)}</p>
          <p class="bk__verdict">${t('over.reveal', { truth: fmtNum(it.truth), hit: hit ? t('over.hit') : t('over.miss') })}</p>
          ${gridHtml(hit ? 90 : 60)}
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      }
      return `
        <p class="bk__round">${t('sub.round', { n: i + 1, total: 6 })}</p>
        <h2 class="bk__q">${t(`anchor.q.${item().id}`)}</h2>
        <p class="bk__note">${t('over.prompt')}</p>
        ${sliderHtml({ label: t('over.low'), min: item().min, max: item().max, unsetKey: t('anchor.unset'), lockKey: t('sub.next') })}`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!btn) return;
      switch (btn.dataset.act) {
        case 'start':
          step = 'play';
          i = 0;
          hits = [];
          paint();
          break;
        case 'lock':
          low = readSlider(card, item().min, item().max) ?? item().min;
          high = Math.min(item().max, low + (item().max - item().min) * 0.4);
          step = 'reveal';
          paint();
          break;
        case 'next':
          i += 1;
          step = stepAfterRound(i);
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

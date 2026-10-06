import '../../../bias/kit/styles.css';
import { meterPair } from '../../../bias/kit/html';
import { mountCard, paintFocus, saveAndDoneHtml } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import { curriculum } from '../../../bias/catalog';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { getGameStats } from '../../../core/storage';

type Step = 'intro' | 'rate' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let selfRating = 5;
    let otherRating = 5;

    const { card, unmount } = mountCard(el);

    const measured = (): number => {
      const meters = getGameStats(opts.gameId).biasMeters ?? {};
      const ids = curriculum.filter((b) => b.id !== 'blind').map((b) => b.id);
      const vals = ids.map((id) => meters[id]?.before ?? 0).filter((v) => v > 0);
      return vals.length === 0 ? 0 : Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('blind', 'sub.play', 'blind.intro');
      if (step === 'tip') return tipBlock('blind.tip.title', 'blind.tip.body');
      if (step === 'done') {
        return saveAndDoneHtml(opts.gameId, 'blind', Math.abs(selfRating - measured()), Math.max(0, Math.abs(selfRating - measured()) - 2), `<p class="bk__note">${t('blind.done')}</p>`);
      }
      if (step === 'reveal') {
        const m = measured();
        return `
          <p class="bk__verdict">${t('blind.reveal', { self: selfRating, other: otherRating, measured: m })}</p>
          ${meterPair(selfRating * 10, m, t('blind.you'), t('blind.meter'))}
          <button type="button" class="bk__btn" data-act="donego" data-focus>${t('sub.continue')}</button>`;
      }
      return `
        <h2 class="bk__q">${t('blind.rate')}</h2>
        <p class="bk__note">${t('blind.prompt')}</p>
        <input type="range" min="1" max="10" value="${selfRating}" data-self class="bk__range" />
        <input type="range" min="1" max="10" value="${otherRating}" data-other class="bk__range" />
        <button type="button" class="bk__btn" data-act="rate" data-focus>${t('sub.continue')}</button>`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!btn) return;
      switch (btn.dataset.act) {
        case 'start':
          step = 'rate';
          paint();
          break;
        case 'rate':
          selfRating = Number((card.querySelector('[data-self]') as HTMLInputElement).value);
          otherRating = Number((card.querySelector('[data-other]') as HTMLInputElement).value);
          step = 'reveal';
          paint();
          break;
        case 'donego':
          step = 'tip';
          paint();
          break;
        case 'tip':
          step = 'done';
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

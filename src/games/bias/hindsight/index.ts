import '../../../bias/kit/styles.css';
import { bindSlider, readSlider, sliderHtml } from '../../../bias/kit/slider';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { meanShift, recallShift } from './logic';

type Step = 'intro' | 'record' | 'outcome' | 'recall' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let recorded = 50;
    let lastRecall = 50;
    let shifts: number[] = [];
    const prompts = ['coin', 'startup', 'flight', 'exam', 'rain', 'match'];
    const outcomes = [true, false, true, false, false, true];

    const { card, unmount } = mountCard(el);

    const paint = () => {
      card.innerHTML = view();
      bindSlider(card, 0, 100, t('anchor.unset'));
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('hindsight', 'sub.play', 'hind.intro');
      if (step === 'tip') return tipBlock('hind.tip.title', 'hind.tip.body');
      if (step === 'done') {
        return saveAndDoneHtml(opts.gameId, 'hindsight', meanShift(shifts.slice(0, 3)), meanShift(shifts.slice(3)));
      }
      if (step === 'outcome')
        return `<h2 class="bk__q">${t(`hind.q.${prompts[round]}`)}</h2><p class="bk__verdict">${t('hind.outcome', { yes: outcomes[round] ? t('hind.yes') : t('hind.no') })}</p><button type="button" class="bk__btn" data-act="outcome" data-focus>${t('sub.continue')}</button>`;
      if (step === 'reveal') {
        const shift = shifts[shifts.length - 1] ?? 0;
        return `
          <p class="bk__verdict">${t('hind.reveal', { recorded, recalled: lastRecall, shift })}</p>
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      }
      if (step === 'recall')
        return `
          <p class="bk__round">${roundLabel(round)}</p>
          <h2 class="bk__q">${t(`hind.q.${prompts[round]}`)}</h2>
          <p class="bk__note">${t('hind.recall')}</p>
          ${sliderHtml({ label: t('hind.conf'), min: 0, max: 100, unsetKey: t('anchor.unset'), lockKey: t('sub.next') })}`;
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t(`hind.q.${prompts[round]}`)}</h2>
        <p class="bk__note">${t('hind.predict')}</p>
        ${sliderHtml({ label: t('hind.conf'), min: 0, max: 100, unsetKey: t('anchor.unset'), lockKey: t('sub.next') })}`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      switch (btn.dataset.act) {
        case 'start':
          step = 'record';
          round = 0;
          shifts = [];
          paint();
          break;
        case 'lock':
          if (step === 'record') {
            recorded = readSlider(card, 0, 100) ?? 50;
            step = 'outcome';
            paint();
          } else if (step === 'recall') {
            lastRecall = readSlider(card, 0, 100) ?? recorded;
            shifts.push(recallShift(recorded, lastRecall));
            step = 'reveal';
            paint();
          }
          break;
        case 'outcome':
          step = 'recall';
          paint();
          break;
        case 'next':
          round += 1;
          { const next = stepAfterRound(round); step = next === 'play' ? 'record' : next; }
          paint();
          break;
        case 'tip':
          step = 'record';
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

import '../../../bias/kit/styles.css';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml } from '../../../bias/kit/flow';
import { scaleHtml, wheelHtml } from '../../../bias/kit/html';
import { bindSlider, fmtNum, readSlider, sliderHtml } from '../../../bias/kit/slider';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { mulberry32 } from '../../../core/rng';
import { anchorOf, buildPlan, fracOf, meters, pull, type Question, type Round } from './logic';

type Step = 'intro' | 'tip' | 'spin' | 'range' | 'guess' | 'reveal' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let plan = buildPlan(mulberry32(Date.now() & 0xffff));
    let rounds: Round[] = [];
    let i = 0;
    let step: Step = 'intro';
    let spinDeg = 0;
    let rangeLow: number | undefined;
    let rangeHigh: number | undefined;

    const { card, unmount } = mountCard(el);
    const cur = () => plan[i];
    const q = (): Question => cur().q;

    const head = () => `<p class="bk__round">${roundLabel(i, plan.length)}</p>`;
    const ask = () => `<h2 class="bk__q">${t(`anchor.q.${q().id}`)}</h2>`;

    const paint = () => {
      card.innerHTML = view();
      bindSlider(card, q().min, q().max, t('anchor.unset'));
      paintFocus(card);
    };

    const view = (): string => {
      switch (step) {
        case 'intro':
          return introBlock('anchoring', 'sub.play', 'anchor.intro.body', t('sub.anchor.controls.desktop'), t('sub.anchor.controls.touch'));
        case 'tip':
          return tipBlock('anchor.tip.title', 'anchor.tip.body');
        case 'spin': {
          const anchor = anchorOf(q(), cur().side);
          return `${head()}${ask()}<p class="bk__note">${t('anchor.spin.help')}</p>${wheelHtml(anchor, true, spinDeg)}<button type="button" class="bk__btn" data-act="spun" data-focus>${t('sub.continue')}</button>`;
        }
        case 'range':
          return `${head()}${ask()}<p class="bk__note">${t('anchor.range.help')}</p>
            ${sliderHtml({ label: t('anchor.range.low'), min: q().min, max: q().max, value: rangeLow, unsetKey: t('anchor.unset'), lockKey: t('sub.next') })}
            <div data-range-high>${sliderHtml({ label: t('anchor.range.high'), min: q().min, max: q().max, value: rangeHigh, unsetKey: t('anchor.unset'), lockKey: t('sub.next') })}</div>`;
        case 'guess': {
          const anchor = anchorOf(q(), cur().side);
          return `${head()}${ask()}<p class="bk__seen">${t('anchor.seen', { anchor: fmtNum(anchor) })}</p>${wheelHtml(anchor, false, spinDeg)}${sliderHtml({ label: t('anchor.guess'), min: q().min, max: q().max, unsetKey: t('anchor.unset'), lockKey: t('anchor.lock') })}`;
        }
        case 'reveal': {
          const r = rounds[rounds.length - 1];
          const p = pull(r.q, r.anchor, r.guess);
          const at = (v: number) => fracOf(r.q, v) * 100;
          return `${head()}${ask()}
            <p class="bk__verdict">${t('anchor.reveal.truth', { truth: fmtNum(r.q.truth), guess: fmtNum(r.guess), anchor: fmtNum(r.anchor) })}</p>
            ${scaleHtml([
              { cls: 'anchor', label: t('anchor.reveal.anchor'), at: at(r.anchor), text: fmtNum(r.anchor) },
              { cls: 'you', label: t('anchor.reveal.you'), at: at(r.guess), text: fmtNum(r.guess) },
              { cls: 'truth', label: t('anchor.reveal.answer'), at: at(r.q.truth), text: fmtNum(r.q.truth) },
            ])}
            <p class="bk__verdict">${t(p > 0.2 ? 'anchor.verdict.mid' : 'anchor.verdict.away', { anchor: fmtNum(r.anchor) })}</p>
            <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
        }
        case 'done': {
          const m = meters(rounds);
          return `${saveAndDoneHtml(opts.gameId, 'anchoring', m.before, m.after, `<p class="bk__verdict">${t('sub.accuracy', { pct: m.accuracy })}</p>`)}`;
        }
      }
    };

    const begin = () => {
      rangeLow = rangeHigh = undefined;
      spinDeg = (spinDeg + 137) % 360;
      if (i >= plan.length) {
        step = 'done';
        paint();
        return;
      }
      if (i === 3) {
        step = 'tip';
      } else if (cur().aided) {
        step = 'range';
      } else {
        step = 'spin';
      }
      paint();
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!btn || (btn as HTMLButtonElement).disabled) return;
      switch (btn.dataset.act) {
        case 'start':
        case 'again':
          plan = buildPlan(mulberry32(Date.now() & 0xffff));
          rounds = [];
          i = 0;
          begin();
          break;
        case 'tip':
          step = 'range';
          paint();
          break;
        case 'spun':
          step = 'guess';
          paint();
          break;
        case 'lock':
          if (step === 'range') {
            const low = readSlider(card, q().min, q().max);
            if (low === null) return;
            rangeLow = low;
            rangeHigh = Math.min(q().max, low + (q().max - q().min) * 0.25);
            step = 'spin';
            paint();
          } else if (step === 'guess') {
            const guess = readSlider(card, q().min, q().max);
            if (guess === null) return;
            rounds.push({ ...cur(), anchor: anchorOf(q(), cur().side), guess, rangeLow, rangeHigh });
            step = 'reveal';
            paint();
          }
          break;
        case 'next':
          i += 1;
          begin();
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

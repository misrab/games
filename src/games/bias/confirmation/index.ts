import '../../../bias/kit/styles.css';
import { mountCard, paintFocus, roundLabel, saveAndDoneHtml, stepAfterRound } from '../../../bias/kit/flow';
import { introBlock, tipBlock } from '../../../bias/kit/shell';
import type { Game, GameOpts } from '../../../core/game';
import { t } from '../../../core/i18n';
import { biasRate, rules, type Rule } from './logic';

type Step = 'intro' | 'play' | 'reveal' | 'tip' | 'done';

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    let step: Step = 'intro';
    let round = 0;
    let aided = false;
    let rule: Rule = rules[0];
    let attempts: boolean[] = [];
    let triple: [number, number, number] = [2, 4, 6];

    const { card, unmount } = mountCard(el);

    const paint = () => {
      card.innerHTML = view();
      paintFocus(card);
    };

    const view = () => {
      if (step === 'intro')
        return introBlock('confirmation', 'sub.play', 'confirm.intro');
      if (step === 'tip') return tipBlock('confirm.tip.title', 'confirm.tip.body');
      if (step === 'done') {
        return saveAndDoneHtml(opts.gameId, 'confirmation', biasRate(attempts.slice(0, 3)), biasRate(attempts.slice(3)));
      }
      if (step === 'reveal') {
        const confirmatory = rule.fits(...triple);
        attempts.push(confirmatory);
        return `
          <p class="bk__round">${roundLabel(round)}</p>
          <p class="bk__verdict">${confirmatory ? t('confirm.reveal.confirm') : t('confirm.reveal.break')}</p>
          <button type="button" class="bk__btn" data-act="next" data-focus>${t('sub.next')}</button>`;
      }
      return `
        <p class="bk__round">${roundLabel(round)}</p>
        <h2 class="bk__q">${t('confirm.prompt')}</h2>
        <p class="bk__note">${t(`confirm.seed.${rule.id}`)}</p>
        <div class="bk__row">
          <input class="bk__btn" type="number" data-a value="${triple[0]}" aria-label="a" />
          <input class="bk__btn" type="number" data-b value="${triple[1]}" aria-label="b" />
          <input class="bk__btn" type="number" data-c value="${triple[2]}" aria-label="c" />
        </div>
        <button type="button" class="bk__btn" data-act="test" data-focus>${t('confirm.test')}</button>`;
    };

    const onClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!btn) return;
      switch (btn.dataset.act) {
        case 'start':
          step = 'play';
          round = 0;
          aided = false;
          attempts = [];
          rule = rules[round % rules.length];
          paint();
          break;
        case 'test':
          triple = [
            Number((card.querySelector('[data-a]') as HTMLInputElement).value),
            Number((card.querySelector('[data-b]') as HTMLInputElement).value),
            Number((card.querySelector('[data-c]') as HTMLInputElement).value),
          ];
          step = 'reveal';
          paint();
          break;
        case 'next':
          round += 1;
          if (round === 3) aided = true;
          step = stepAfterRound(round);
          rule = rules[round] ?? rules[0];
          triple = [2, 4, 6];
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

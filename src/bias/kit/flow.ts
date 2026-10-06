import { t } from '../../core/i18n';
import { saveBiasMeter } from '../../core/storage';
import { doneBlock } from './shell';

export const TOTAL_ROUNDS = 6;
export const TRAP_ROUNDS = 3;

export interface CardMount {
  card: HTMLElement;
  unmount: () => void;
}

export function mountCard(el: HTMLElement): CardMount {
  el.innerHTML = `<section class="bk"><div class="bk__card" data-card></div></section>`;
  const card = el.querySelector('[data-card]') as HTMLElement;
  return { card, unmount: () => el.replaceChildren() };
}

export function paintFocus(card: HTMLElement): void {
  (card.querySelector('[data-focus]') as HTMLElement | null)?.focus({ preventScroll: true });
  const scroller = card.closest('.bk');
  if (scroller) (scroller as HTMLElement).scrollTop = 0;
}

export function roundLabel(round: number, total = TOTAL_ROUNDS): string {
  return t('sub.round', { n: round + 1, total });
}

export function stepAfterRound(round: number): 'tip' | 'done' | 'play' {
  const next = round + 1;
  if (next === TRAP_ROUNDS) return 'tip';
  if (next >= TOTAL_ROUNDS) return 'done';
  return 'play';
}

export function saveAndDoneHtml(gameId: string, biasId: string, before: number, after: number, extra = ''): string {
  saveBiasMeter(gameId, biasId, before, after);
  return doneBlock(before, after, extra);
}

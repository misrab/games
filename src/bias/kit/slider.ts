import { getLocale } from '../../core/i18n';

const STEPS = 1000;

export function fmtNum(n: number): string {
  return new Intl.NumberFormat(getLocale(), { useGrouping: Math.abs(n) >= 10000 }).format(n);
}

export function sliderHtml(opts: {
  label: string;
  min: number;
  max: number;
  value?: number;
  unsetKey: string;
  lockKey: string;
  id?: string;
}): string {
  const frac =
    opts.value === undefined ? STEPS / 2 : ((opts.value - opts.min) / (opts.max - opts.min)) * STEPS;
  const blank = opts.value === undefined;
  return `
    <p class="bk__label">${opts.label}</p>
    <output class="bk__value" data-value>${blank ? opts.unsetKey : fmtNum(opts.value!)}</output>
    <input type="range" class="bk__range${blank ? ' is-blank' : ''}" data-range data-focus
      min="0" max="${STEPS}" step="1" value="${Math.round(frac)}"
      aria-label="${opts.label}" />
    <div class="bk__ends"><span>${fmtNum(opts.min)}</span><span>${fmtNum(opts.max)}</span></div>
    <button type="button" class="bk__btn" data-act="lock" ${blank ? 'disabled' : ''}>${opts.lockKey}</button>`;
}

export function readSlider(card: HTMLElement, min: number, max: number): number | null {
  const range = card.querySelector('[data-range]') as HTMLInputElement | null;
  if (!range || range.classList.contains('is-blank')) return null;
  const frac = Number(range.value) / STEPS;
  return Math.round(min + (max - min) * frac);
}

export function bindSlider(card: HTMLElement, min: number, max: number, unset: string): void {
  const arm = (range: HTMLInputElement) => {
    range.classList.remove('is-blank');
    const out = card.querySelector('[data-value]') as HTMLElement;
    const val = Math.round(min + (max - min) * (Number(range.value) / STEPS));
    out.textContent = fmtNum(val);
    (card.querySelector('[data-act="lock"]') as HTMLButtonElement).disabled = false;
  };
  card.querySelectorAll('[data-range]').forEach((el) => {
    el.addEventListener('input', () => arm(el as HTMLInputElement));
    el.addEventListener('pointerdown', () => arm(el as HTMLInputElement));
  });
  card.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !(e.target as HTMLElement).matches('[data-range]')) return;
    const lockBtn = card.querySelector('[data-act="lock"]') as HTMLButtonElement;
    if (!lockBtn.disabled) lockBtn.click();
  });
}

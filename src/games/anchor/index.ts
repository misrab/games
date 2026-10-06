import type { Game } from '../../core/game';
import { getLocale, t } from '../../core/i18n';
import { mulberry32 } from '../../core/rng';
import { saveRun } from '../../core/storage';
import {
  PHASE_SIZE,
  anchorOf,
  buildPlan,
  fracOf,
  pull,
  summarize,
  valueAt,
  type Plan,
  type Question,
  type Round,
} from './logic';
import './style.css';

type Step = 'intro' | 'tip' | 'gut' | 'guess' | 'reveal' | 'done';

const STEPS = 1000;

let stop: (() => void) | null = null;

function fmt(n: number): string {
  return new Intl.NumberFormat(getLocale(), { useGrouping: Math.abs(n) >= 10000 }).format(n);
}

function pct(p: number): number {
  return Math.round(Math.max(0, p) * 100);
}

const game: Game = {
  mount(el, opts) {
    let plan: Plan[] = [];
    let rounds: Round[] = [];
    let i = 0;
    let step: Step = 'intro';
    let gut: number | undefined;

    el.innerHTML = `<section class="an"><div class="an__card" data-card></div></section>`;
    const card = el.querySelector('[data-card]') as HTMLElement;

    const cur = () => plan[i];
    const head = () => `<p class="an__round">${t('anchor.round', { n: i + 1, total: plan.length })}</p>`;
    const ask = (q: Question) => `<h2 class="an__q">${t(`anchor.q.${q.id}`)}</h2>`;

    const slider = (q: Question, label: string, start?: number) => `
      <p class="an__label">${label}</p>
      <output class="an__value" data-value>${start === undefined ? t('anchor.unset') : fmt(start)}</output>
      <input type="range" class="an__range${start === undefined ? ' is-blank' : ''}" data-range data-focus
        min="0" max="${STEPS}" step="1" value="${start === undefined ? STEPS / 2 : Math.round(fracOf(q, start) * STEPS)}"
        aria-label="${label}" />
      <div class="an__ends"><span>${fmt(q.min)}</span><span>${fmt(q.max)}</span></div>
      <button type="button" class="an__btn" data-act="lock" ${start === undefined ? 'disabled' : ''}>${t('anchor.lock')}</button>`;

    const reveal = (r: Round) => {
      const { q, side } = r;
      const anchor = anchorOf(q, side);
      const p = pull(q, side, r.guess);
      const at = (v: number) => Math.max(0, Math.min(100, fracOf(q, v) * 100));
      const marks: { cls: string; label: string; v: number }[] = [
        { cls: 'anchor', label: t('anchor.reveal.anchor'), v: anchor },
        ...(r.gut === undefined ? [] : [{ cls: 'gut', label: t('anchor.reveal.gut'), v: r.gut }]),
        { cls: 'you', label: t('anchor.reveal.you'), v: r.guess },
        { cls: 'truth', label: t('anchor.reveal.answer'), v: q.truth },
      ];
      const verdict = p >= 0.5 ? 'anchor.verdict.high' : p >= 0.2 ? 'anchor.verdict.mid' : p > 0 ? 'anchor.verdict.low' : 'anchor.verdict.away';
      marks.sort((a, b) => a.v - b.v);
      const named =
        rounds.length === 1 ? `<p class="an__note">${t(p > 0 ? 'anchor.verdict.what' : 'anchor.verdict.whatnot')}</p>` : '';
      const gutLine =
        r.gut === undefined ? '' : `<p class="an__note">${t('anchor.reveal.shift', { gut: fmt(r.gut), guess: fmt(r.guess) })}</p>`;
      return `
        ${head()}
        ${ask(q)}
        <p class="an__verdict">${t('anchor.reveal.truth', { truth: fmt(q.truth), guess: fmt(r.guess), anchor: fmt(anchor) })}</p>
        <div class="an__scale" aria-hidden="true">
          ${marks.map((m) => `<span class="an__mark an__mark--${m.cls}" style="left:${at(m.v)}%"></span>`).join('')}
        </div>
        <ul class="an__legend">
          ${marks.map((m) => `<li class="an__key an__key--${m.cls}">${m.label} <b>${fmt(m.v)}</b></li>`).join('')}
        </ul>
        <p class="an__verdict">${t(verdict, { anchor: fmt(anchor) })}</p>
        ${gutLine}
        ${named}
        <button type="button" class="an__btn" data-act="next" data-focus>${t('anchor.next')}</button>`;
    };

    const done = () => {
      const s = summarize(rounds);
      return `
        <h2 class="an__q">${t('anchor.done.title')}</h2>
        <p class="an__verdict">${t('anchor.done.cold', { pct: pct(s.cold) })}</p>
        <p class="an__verdict">${t('anchor.done.aided', { pct: pct(s.aided) })}</p>
        <p class="an__note">${t('anchor.done.note')}</p>
        <button type="button" class="an__btn" data-act="again" data-focus>${t('anchor.again')}</button>`;
    };

    const view = (): string => {
      switch (step) {
        case 'intro':
          return `
            <h2 class="an__q">${t('bias.anchoring.name')}</h2>
            <p class="an__note">${t('bias.anchoring.body')}</p>
            <a class="an__paper" href="${t('bias.anchoring.url')}" target="_blank" rel="noopener noreferrer">${t('bias.anchoring.link')}</a>
            <p class="an__note">${t('anchor.intro.body')}</p>
            <button type="button" class="an__btn" data-act="start" data-focus>${t('anchor.start')}</button>`;
        case 'tip':
          return `
            <h2 class="an__q">${t('anchor.tip.title')}</h2>
            <p class="an__note">${t('anchor.tip.body')}</p>
            <button type="button" class="an__btn" data-act="tip" data-focus>${t('anchor.tip.go')}</button>`;
        case 'gut':
          return `${head()}${ask(cur().q)}<p class="an__note">${t('anchor.gut.help')}</p>${slider(cur().q, t('anchor.gut'))}`;
        case 'guess': {
          const anchor = fmt(anchorOf(cur().q, cur().side));
          const seen =
            gut === undefined
              ? `<p class="an__seen">${t('anchor.seen', { anchor })}</p><p class="an__note">${t('anchor.guess.help')}</p>`
              : `<p class="an__seen">${t('anchor.seen.after', { gut: fmt(gut), anchor })}</p><p class="an__note">${t('anchor.guess.help2')}</p>`;
          return `${head()}${ask(cur().q)}${seen}${slider(cur().q, t('anchor.guess'), gut)}`;
        }
        case 'reveal':
          return reveal(rounds[rounds.length - 1]);
        case 'done':
          return done();
      }
    };

    const paint = () => {
      card.innerHTML = view();
      (card.querySelector('[data-focus]') as HTMLElement | null)?.focus({ preventScroll: true });
      const scroller = card.closest('.an');
      if (scroller) scroller.scrollTop = 0;
    };

    const begin = () => {
      gut = undefined;
      if (i >= plan.length) {
        step = 'done';
        saveRun(opts.gameId, summarize(rounds).score);
      } else if (i === PHASE_SIZE) {
        step = 'tip';
      } else {
        step = cur().aided ? 'gut' : 'guess';
      }
      paint();
    };

    const lock = () => {
      const range = card.querySelector('[data-range]') as HTMLInputElement | null;
      if (!range || range.classList.contains('is-blank')) return;
      const value = valueAt(cur().q, Number(range.value) / STEPS);
      if (step === 'gut') {
        gut = value;
        step = 'guess';
      } else {
        rounds.push({ ...cur(), gut, guess: value });
        step = 'reveal';
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
          step = 'gut';
          paint();
          break;
        case 'lock':
          lock();
          break;
        case 'next':
          i += 1;
          begin();
          break;
      }
    };

    const arm = (range: HTMLInputElement) => {
      range.classList.remove('is-blank');
      (card.querySelector('[data-value]') as HTMLElement).textContent = fmt(valueAt(cur().q, Number(range.value) / STEPS));
      (card.querySelector('[data-act="lock"]') as HTMLButtonElement).disabled = false;
    };

    const onInput = (e: Event) => {
      const range = e.target as HTMLInputElement;
      if (range.matches('[data-range]')) arm(range);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !(e.target as HTMLElement).matches('[data-range]')) return;
      const lockBtn = card.querySelector('[data-act="lock"]') as HTMLButtonElement;
      if (!lockBtn.disabled) lockBtn.click();
    };

    card.addEventListener('click', onClick);
    card.addEventListener('input', onInput);
    card.addEventListener('pointerdown', onInput);
    card.addEventListener('keydown', onKey);
    paint();

    stop = () => {
      card.removeEventListener('click', onClick);
      card.removeEventListener('input', onInput);
      card.removeEventListener('pointerdown', onInput);
      card.removeEventListener('keydown', onKey);
      el.replaceChildren();
    };
  },

  unmount() {
    stop?.();
    stop = null;
  },
};

export default game;

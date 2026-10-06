import { curriculum, type BiasSpec } from '../../bias/catalog';
import type { Game, GameOpts } from '../../core/game';
import { t } from '../../core/i18n';
import { getBiasMeter } from '../../core/storage';
import './style.css';

function subId(): string | undefined {
  const path = (location.hash.slice(1) || '/').replace(/^\//, '');
  const [, sub] = path.split('/');
  return sub || undefined;
}

const marks: Record<string, string> = {
  anchoring: `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 22 L34 10" stroke="var(--accent)" stroke-width="3"/><circle cx="22" cy="22" r="3" fill="var(--accent)"/></svg>`,
  availability: `<svg viewBox="0 0 44 44"><path d="M8 10 h22 a4 4 0 0 1 4 4 v10 a4 4 0 0 1-4 4 H16 l-6 6 v-6 H8 a4 4 0 0 1-4-4 V14 a4 4 0 0 1 4-4z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="19" r="2" fill="var(--accent)"/><circle cx="22" cy="19" r="2" fill="var(--accent)"/><circle cx="28" cy="19" r="2" fill="var(--accent)"/></svg>`,
  representativeness: `<svg viewBox="0 0 44 44">${Array.from({ length: 16 }, (_, i) => `<rect x="${6 + (i % 4) * 9}" y="${6 + Math.floor(i / 4) * 9}" width="6" height="6" fill="${i < 6 ? 'var(--accent)' : 'currentColor'}" opacity="${i < 6 ? 1 : 0.35}"/>`).join('')}</svg>`,
  confirmation: `<svg viewBox="0 0 44 44"><rect x="6" y="12" width="10" height="20" fill="none" stroke="currentColor" stroke-width="2"/><rect x="17" y="8" width="10" height="20" fill="var(--accent)"/><rect x="28" y="14" width="10" height="20" fill="none" stroke="currentColor" stroke-width="2"/></svg>`,
  sunk: `<svg viewBox="0 0 44 44"><path d="M10 34 h24" stroke="currentColor" stroke-width="2"/><path d="M14 34 V18 l8-8 8 8 v16" fill="none" stroke="currentColor" stroke-width="2"/><rect x="20" y="22" width="6" height="8" fill="var(--accent)"/></svg>`,
  overconfidence: `<svg viewBox="0 0 44 44"><path d="M8 30 A16 16 0 0 1 36 30" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 28 L30 14" stroke="var(--accent)" stroke-width="3"/><circle cx="22" cy="28" r="3" fill="var(--accent)"/></svg>`,
  blind: `<svg viewBox="0 0 44 44"><circle cx="15" cy="18" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="29" cy="18" r="7" fill="none" stroke="var(--accent)" stroke-width="2"/><path d="M8 34 q7-6 14 0" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 34 q7-6 14 0" fill="none" stroke="var(--accent)" stroke-width="2"/></svg>`,
  framing: `<svg viewBox="0 0 44 44"><rect x="6" y="8" width="14" height="28" fill="none" stroke="currentColor" stroke-width="2"/><rect x="24" y="8" width="14" height="28" fill="var(--accent)" opacity="0.85"/></svg>`,
  loss: `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 8 A14 14 0 0 1 22 36" fill="var(--accent)"/></svg>`,
  hindsight: `<svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="14" fill="none" stroke="currentColor" stroke-width="2"/><path d="M22 14 v8 l6 4" fill="none" stroke="var(--accent)" stroke-width="2"/></svg>`,
  planning: `<svg viewBox="0 0 44 44"><path d="M12 8 h20 l-8 12 8 16 H12 l8-16z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 28 h12" stroke="var(--accent)" stroke-width="3"/></svg>`,
};

function meterBar(before: number, after: number): string {
  return `
    <span class="cog__meter" aria-hidden="true">
      <span class="cog__meter-track"><span style="width:${Math.max(4, Math.min(100, before))}%"></span></span>
      <span class="cog__meter-track cog__meter-track--after"><span style="width:${Math.max(4, Math.min(100, after))}%"></span></span>
    </span>
    <span class="cog__note">${t('cog.meter', { before, after })}</span>`;
}

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    const spec = curriculum.find((bias) => bias.gameId === subId());
    if (!spec) {
      mountDash(el, opts.gameId);
      return;
    }
    void mountSub(el, opts, spec);
  },

  unmount() {
    stop?.();
    stop = null;
  },
};

function mountDash(el: HTMLElement, gameId: string): void {
  el.innerHTML = `
    <section class="cog cog--dash">
      <div class="cog__dash">
        <p class="cog__lead">${t('cog.lead')}</p>
        <ul class="cog__grid">
          ${curriculum
            .map((bias) => {
              const meter = getBiasMeter(gameId, bias.id);
              return `
                <li class="cog__item">
                  <a class="cog__tile" href="#/bias/${bias.gameId}">
                    <span class="cog__mark" aria-hidden="true">${marks[bias.id] ?? ''}</span>
                    <span class="cog__copy">
                      <span class="cog__name">${t(`bias.${bias.id}.name`)}</span>
                      <span class="cog__body">${t(`bias.${bias.id}.body`)}</span>
                      ${meter ? meterBar(meter.before, meter.after) : `<span class="cog__play">${t('cog.open')}</span>`}
                    </span>
                  </a>
                  <a class="cog__paper" href="${t(`bias.${bias.id}.url`)}" target="_blank" rel="noopener noreferrer">${t(`bias.${bias.id}.link`)}</a>
                </li>`;
            })
            .join('')}
        </ul>
      </div>
    </section>`;
  stop = () => el.replaceChildren();
}

async function mountSub(el: HTMLElement, opts: GameOpts, spec: BiasSpec): Promise<void> {
  el.innerHTML = `
    <section class="cog">
      <a class="cog__all" href="#/bias">${t('cog.all')}</a>
      <div class="cog__slot" data-slot></div>
    </section>`;
  const slot = el.querySelector('[data-slot]') as HTMLElement;
  const mod = await spec.load();
  mod.default.mount(slot, opts);
  stop = () => {
    mod.default.unmount();
    el.replaceChildren();
  };
}

export default game;

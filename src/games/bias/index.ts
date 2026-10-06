import { curriculum, type BiasSpec } from '../../bias/catalog';
import type { Game, GameOpts } from '../../core/game';
import { t } from '../../core/i18n';
import anchor from '../anchor';
import './style.css';

function subId(): string | undefined {
  const path = (location.hash.slice(1) || '/').replace(/^\//, '');
  const [, sub] = path.split('/');
  return sub || undefined;
}

function explain(bias: BiasSpec): string {
  return `
    <h2 class="cog__name">${t(`bias.${bias.id}.name`)}</h2>
    <p>${t(`bias.${bias.id}.body`)}</p>
    <a class="cog__paper" href="${t(`bias.${bias.id}.url`)}" target="_blank" rel="noopener noreferrer">${t(`bias.${bias.id}.link`)}</a>`;
}

let stop: (() => void) | null = null;

const game: Game = {
  mount(el, opts) {
    const spec = curriculum.find((bias) => bias.gameId === subId());
    if (!spec) {
      mountDash(el);
      return;
    }
    mountSub(el, opts, spec);
  },

  unmount() {
    stop?.();
    stop = null;
  },
};

function mountDash(el: HTMLElement): void {
  el.innerHTML = `
    <section class="cog">
      <div class="cog__card">
        <p class="cog__note">${t('cog.lead')}</p>
        <ul class="cog__list">
          ${curriculum
            .map(
              (bias) => `
                <li>
                  ${explain(bias)}
                  ${bias.live ? '' : `<p class="cog__note">${t('cog.stub')}</p>`}
                  <a class="cog__open" href="#/bias/${bias.gameId}">${t('cog.open')}</a>
                </li>`,
            )
            .join('')}
        </ul>
      </div>
    </section>`;
  stop = () => el.replaceChildren();
}

function mountSub(el: HTMLElement, opts: GameOpts, spec: BiasSpec): void {
  el.innerHTML = `
    <section class="cog">
      <a class="cog__all" href="#/bias">${t('cog.all')}</a>
      <div class="cog__slot" data-slot></div>
    </section>`;
  const slot = el.querySelector('[data-slot]') as HTMLElement;
  if (spec.live) {
    anchor.mount(slot, opts);
    stop = () => {
      anchor.unmount();
      el.replaceChildren();
    };
    return;
  }
  slot.innerHTML = `
    <div class="cog__card">
      ${explain(spec)}
      <p class="cog__note">${t('cog.stub.body')}</p>
    </div>`;
  stop = () => el.replaceChildren();
}

export default game;

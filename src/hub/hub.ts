import { t } from '../core/i18n';
import { barToolsHtml, bindThemeToggle } from '../core/prefs';
import { getGameStats } from '../core/storage';
import { registry } from '../registry';
import '../core/shell.css';
import './hub.css';

const marks: Record<string, string> = {
  'chicken-pursuit': `
    <svg viewBox="0 0 44 44">
      <rect width="44" height="44" fill="#1b4332"/>
      <circle cx="15" cy="27" r="7" fill="#ffe08a"/>
      <circle cx="17" cy="21" r="2.4" fill="#d7263d"/>
      <circle cx="29" cy="17" r="5.5" fill="#f7f4ef"/>
      <circle cx="31" cy="13" r="2" fill="#d7263d"/>
      <circle cx="30" cy="32" r="3.4" fill="#ffb703"/>
    </svg>`,
  'void-run': `
    <svg viewBox="0 0 44 44">
      <rect width="44" height="44" fill="#05070e"/>
      <circle cx="31" cy="15" r="8" fill="var(--accent)"/>
      <circle cx="28" cy="12" r="3" fill="#f5f8fb"/>
      <path d="M8 30 L24 18 L16 20 L14 26 Z" fill="#e7ecf1"/>
      <circle cx="11" cy="28" r="2.2" fill="var(--accent)"/>
    </svg>`,
  bias: `
    <svg viewBox="0 0 44 44">
      <rect width="44" height="44" fill="#2a1f3d"/>
      <path d="M22 8c-6 0-10 4.2-10 9.2 0 3.2 1.8 5.4 4.2 6.8.8.5 1.3 1.2 1.3 2.1V28h9v-1.9c0-.9.5-1.6 1.3-2.1 2.4-1.4 4.2-3.6 4.2-6.8C32 12.2 28 8 22 8z" fill="#e7ecf1"/>
      <path d="M18 31h8M19.5 34h5" stroke="var(--accent)" stroke-width="2"/>
    </svg>`,
};

export function mountHub(el: HTMLElement): () => void {
  const root = document.createElement('main');
  root.className = 'hub';
  root.innerHTML = `
    <header class="hub__bar">
      <h1>${t('hub.title')}</h1>
      ${barToolsHtml()}
    </header>
    <ul class="hub__list">
      ${registry
        .map((game) => {
          const stats = getGameStats(game.id);
          return `
            <li>
              <button type="button" class="hub__card" data-play="${game.id}">
                <span class="hub__mark" aria-hidden="true">${marks[game.id] ?? ''}</span>
                <span>
                  <span class="hub__name">${t(game.titleKey)}</span>
                  <span class="hub__meta">${game.tags.map((tag) => t(`tag.${tag}`)).join(' · ')} · ${t('hub.best', { score: stats.best })}</span>
                </span>
              </button>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
  el.appendChild(root);
  bindThemeToggle(root);
  root.querySelectorAll('[data-play]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.play;
      if (id) location.hash = `#/${id}`;
    });
  });
  return () => root.remove();
}

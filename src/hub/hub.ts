import { t } from '../core/i18n';
import { bindThemeToggle, themeToggleHtml } from '../core/prefs';
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
};

export function mountHub(el: HTMLElement): () => void {
  const root = document.createElement('main');
  root.className = 'hub';
  root.innerHTML = `
    <header class="hub__bar">
      <h1>${t('hub.title')}</h1>
      ${themeToggleHtml()}
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

import { t } from '../core/i18n';
import { getGameStats } from '../core/storage';
import { registry } from '../registry';
import './hub.css';

export function mountHub(el: HTMLElement): () => void {
  const root = document.createElement('main');
  root.className = 'hub';
  root.innerHTML = `
    <h1>${t('hub.title')}</h1>
    <ul class="hub__list">
      ${registry
        .map((game) => {
          const stats = getGameStats(game.id);
          return `
            <li>
              <button type="button" class="hub__card" data-play="${game.id}">
                <span class="hub__mark" aria-hidden="true"></span>
                <span>
                  <span class="hub__name">${t(game.titleKey)}</span>
                  <span class="hub__meta">${game.tags.join(' · ')} · ${t('hub.best', { score: stats.best })}</span>
                </span>
              </button>
            </li>
          `;
        })
        .join('')}
    </ul>
  `;
  el.appendChild(root);
  root.querySelectorAll('[data-play]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset.play;
      if (id) location.hash = `#/${id}`;
    });
  });
  return () => root.remove();
}

import type { Game, GameMeta } from './game';
import { t } from './i18n';
import { bindThemeRow, themeRowHtml } from './prefs';
import { getGameStats, setGameSettings } from './storage';
import './shell.css';

function initialSettings(meta: GameMeta): Record<string, string> {
  const saved = getGameStats(meta.id).settings;
  const settings: Record<string, string> = {};
  for (const setting of meta.settings ?? []) {
    const current = saved[setting.id];
    settings[setting.id] = setting.options.some((option) => option.id === current)
      ? current
      : setting.default;
  }
  return settings;
}

export function mountShell(el: HTMLElement, meta: GameMeta, game: Game): () => void {
  const settings = initialSettings(meta);

  const root = document.createElement('section');
  root.className = 'shell';
  root.innerHTML = `
    <header class="shell__bar">
      <button type="button" class="shell__back" data-back>${t('shell.back')}</button>
      <h1>${t(meta.titleKey)}</h1>
    </header>
    <details class="shell__panel">
      <summary>${t('shell.how')}</summary>
      <p>${t(meta.instructionsKey)}</p>
    </details>
    <details class="shell__panel">
      <summary>${t('shell.settings')}</summary>
      ${themeRowHtml()}
      ${(meta.settings ?? [])
        .map(
          (setting) => `
            <div class="shell__setting">
              <span>${t(setting.labelKey)}</span>
              <div class="shell__options">
                ${setting.options
                  .map(
                    (option) =>
                      `<button type="button" data-setting="${setting.id}" data-value="${option.id}">${t(option.labelKey)}</button>`,
                  )
                  .join('')}
              </div>
            </div>`,
        )
        .join('')}
    </details>
    <div class="shell__game" data-game></div>
  `;
  el.appendChild(root);

  const slot = root.querySelector('[data-game]') as HTMLElement;

  const paint = () => {
    root.querySelectorAll('[data-setting]').forEach((btn) => {
      const node = btn as HTMLElement;
      const id = node.dataset.setting ?? '';
      node.classList.toggle('is-on', settings[id] === node.dataset.value);
    });
  };

  const start = () => {
    game.mount(slot, { gameId: meta.id, settings: { ...settings } });
    paint();
  };

  bindThemeRow(root);
  root.querySelector('[data-back]')?.addEventListener('click', () => {
    location.hash = '#/';
  });

  root.querySelectorAll('[data-setting]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const node = btn as HTMLElement;
      const id = node.dataset.setting;
      const value = node.dataset.value;
      if (!id || !value || settings[id] === value) return;
      settings[id] = value;
      setGameSettings(meta.id, settings);
      game.unmount();
      start();
    });
  });

  start();

  return () => {
    game.unmount();
    root.remove();
  };
}

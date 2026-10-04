import { t } from './i18n';
import { applyTheme, getTheme, setTheme, type ThemeName } from './storage';

export function themeRowHtml(): string {
  const theme = getTheme();
  const button = (id: ThemeName, key: string) =>
    `<button type="button" data-theme="${id}" class="${theme === id ? 'is-on' : ''}">${t(key)}</button>`;
  return `
    <div class="shell__setting">
      <span>${t('app.theme')}</span>
      <div class="shell__options">
        ${button('dark', 'app.theme.dark')}
        ${button('light', 'app.theme.light')}
      </div>
    </div>
  `;
}

export function bindThemeRow(root: ParentNode): void {
  root.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = (btn as HTMLElement).dataset.theme;
      if (next !== 'dark' && next !== 'light') return;
      setTheme(next);
      applyTheme(next);
      root.querySelectorAll('[data-theme]').forEach((node) => {
        node.classList.toggle('is-on', (node as HTMLElement).dataset.theme === next);
      });
    });
  });
}

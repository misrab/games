import { t } from './i18n';
import { applyTheme, getTheme, setTheme, type ThemeName } from './storage';

const sun = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
</svg>`;

const moon = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
  <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/>
</svg>`;

function nextTheme(theme: ThemeName): ThemeName {
  return theme === 'dark' ? 'light' : 'dark';
}

function iconFor(theme: ThemeName): string {
  return theme === 'dark' ? moon : sun;
}

function labelFor(theme: ThemeName): string {
  return t(theme === 'dark' ? 'app.theme.toLight' : 'app.theme.toDark');
}

export function themeToggleHtml(): string {
  const theme = getTheme();
  return `<button type="button" class="theme-toggle" data-theme-toggle aria-label="${labelFor(theme)}">${iconFor(theme)}</button>`;
}

export function bindThemeToggle(root: ParentNode): void {
  const btn = root.querySelector('[data-theme-toggle]');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = nextTheme(getTheme());
    setTheme(next);
    applyTheme(next);
    btn.innerHTML = iconFor(next);
    btn.setAttribute('aria-label', labelFor(next));
  });
}

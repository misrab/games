import { t } from './i18n';
import { applyTheme, getTheme, setTheme, type ThemeName } from './storage';

const sun = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
</svg>`;

const moon = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
  <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/>
</svg>`;

const github = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.015 0 0 1.005-.315 3.3 1.275.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.59 3.3-1.275 3.3-1.275.66 1.485.24 2.715.12 3.015.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A8.02 8.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
</svg>`;

export const GITHUB_REPO_URL = 'https://github.com/misrab/games';

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

export function githubLinkHtml(): string {
  return `<a class="icon-link" href="${GITHUB_REPO_URL}" target="_blank" rel="noopener noreferrer" aria-label="${t('app.github')}">${github}</a>`;
}

export function barToolsHtml(): string {
  return `<div class="bar-tools">${githubLinkHtml()}${themeToggleHtml()}</div>`;
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

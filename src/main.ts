import './core/theme.css';
import { registerMessages, t } from './core/i18n';
import { applyTheme } from './core/storage';
import { mountShell } from './core/shell';
import { mountHub } from './hub/hub';
import { findGameMeta } from './registry';
import en from './i18n/en.json';

registerMessages(en);
applyTheme();

const appEl = document.getElementById('app');
if (!appEl) throw new Error('Missing #app');
const app: HTMLElement = appEl;

let activeUnmount: (() => void) | null = null;

async function route(): Promise<void> {
  activeUnmount?.();
  activeUnmount = null;
  app.innerHTML = '';

  const hash = location.hash.slice(1) || '/';
  const path = hash.startsWith('/') ? hash : `/${hash}`;

  if (path === '/' || path === '') {
    document.title = t('hub.title');
    activeUnmount = mountHub(app);
    return;
  }

  const id = path.replace(/^\//, '');
  const meta = findGameMeta(id);
  if (!meta) {
    app.textContent = t('shell.missing');
    return;
  }

  document.title = t(meta.titleKey);
  const mod = await meta.load();
  activeUnmount = mountShell(app, meta, mod.default);
}

window.addEventListener('hashchange', () => {
  void route();
});

void route();

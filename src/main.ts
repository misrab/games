import './core/theme.css';
import { registerMessages } from './core/i18n';
import { mountHub } from './hub/hub';
import { findGameMeta } from './registry';
import en from './i18n/en.json';

registerMessages(en);

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
    activeUnmount = mountHub(app);
    return;
  }

  const id = path.replace(/^\//, '');
  const meta = findGameMeta(id);
  if (!meta) {
    app.textContent = 'Game not found';
    return;
  }

  const mod = await meta.load();
  mod.default.mount(app, { gameId: id });
  activeUnmount = () => mod.default.unmount();
}

window.addEventListener('hashchange', () => {
  void route();
});

void route();

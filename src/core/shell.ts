import type { Game, GameMeta } from './game';
import { t } from './i18n';
import { clearPauseHolds, isSimulationPaused, setPauseHold } from './loop';
import { pointerKind, watchPointer } from './pointer';
import { bindThemeToggle, themeToggleHtml } from './prefs';
import { getGameStats, markHowSeen, setGameSettings } from './storage';
import './shell.css';

const pauseSvg = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>`;
const playSvg = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;

const GAME_KEYS = new Set([
  'arrowup',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'w',
  'a',
  's',
  'd',
  ' ',
]);

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
  const firstVisit = !getGameStats(meta.id).seenHow;
  const controlsText = () => t(`${meta.controlsKey}.${pointerKind()}`);

  const selected = (short: boolean) => {
    const parts: string[] = [];
    for (const setting of meta.settings ?? []) {
      const option = setting.options.find((item) => item.id === settings[setting.id]);
      if (!option) continue;
      parts.push(short ? t(option.shortKey ?? option.labelKey) : `${t(setting.labelKey)} ${t(option.labelKey)}`);
    }
    return parts.join(' · ');
  };

  const root = document.createElement('section');
  root.className = 'shell';
  root.innerHTML = `
    <header class="shell__bar">
      <button type="button" class="shell__back" data-back>${t('shell.back')}</button>
      <h1>${t(meta.titleKey)}</h1>
      <div class="shell__tools">
        <button type="button" class="shell__link" data-how-toggle aria-expanded="${firstVisit ? 'true' : 'false'}" aria-label="${t('shell.how')}">${t('shell.how.short')}</button>
        ${(meta.settings?.length ?? 0) > 0 ? `<button type="button" class="shell__link" data-settings-toggle aria-expanded="false"></button>` : ''}
        <button type="button" class="shell__pause" data-pause aria-pressed="false"></button>
        ${themeToggleHtml()}
      </div>
      <div class="shell__note" data-how ${firstVisit ? '' : 'hidden'}>
        <p>${t(meta.instructionsKey)}</p>
        <p data-controls>${controlsText()}</p>
      </div>
      ${(meta.settings?.length ?? 0) > 0 ? `<div class="shell__note shell__note--end" data-settings-panel hidden>
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
      </div>` : ''}
    </header>
    <div class="shell__stage">
      <div class="shell__game" data-game></div>
      <div class="shell__mask" data-mask hidden></div>
    </div>
  `;
  el.appendChild(root);

  const slot = root.querySelector('[data-game]') as HTMLElement;
  const howNote = root.querySelector('[data-how]') as HTMLElement;
  const settingsNote = root.querySelector('[data-settings-panel]') as HTMLElement | null;
  const howBtn = root.querySelector('[data-how-toggle]') as HTMLButtonElement;
  const settingsBtn = root.querySelector('[data-settings-toggle]') as HTMLButtonElement | null;
  const pauseBtn = root.querySelector('[data-pause]') as HTMLButtonElement;
  const mask = root.querySelector('[data-mask]') as HTMLElement;
  let manual = false;

  const paintPause = () => {
    const showPlay = manual || !howNote.hidden;
    pauseBtn.innerHTML = showPlay ? playSvg : pauseSvg;
    pauseBtn.setAttribute('aria-label', t(showPlay ? 'shell.play' : 'shell.pause'));
    pauseBtn.setAttribute('aria-pressed', manual ? 'true' : 'false');
    mask.hidden = !showPlay;
    root.dataset.paused = isSimulationPaused() ? '1' : '0';
  };

  const syncHow = () => {
    setPauseHold('how', !howNote.hidden);
    paintPause();
  };

  const setOpen = (panel: HTMLElement | null, btn: HTMLButtonElement | null, open: boolean) => {
    if (!panel || !btn) return;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    syncHow();
  };

  const togglePause = () => {
    if (manual || !howNote.hidden) {
      manual = false;
      setPauseHold('manual', false);
      closeNotes();
      return;
    }
    manual = true;
    setPauseHold('manual', true);
    paintPause();
  };

  const closeNotes = () => {
    setOpen(howNote, howBtn, false);
    setOpen(settingsNote, settingsBtn, false);
  };

  const paint = () => {
    if (settingsBtn) {
      settingsBtn.textContent = selected(true);
      settingsBtn.setAttribute('aria-label', `${t('shell.settings')}: ${selected(false)}`);
    }
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

  if (firstVisit) markHowSeen(meta.id);
  const stopPointer = watchPointer(() => {
    const node = root.querySelector('[data-controls]');
    if (node) node.textContent = controlsText();
  });
  bindThemeToggle(root);
  root.querySelector('[data-back]')?.addEventListener('click', () => {
    location.hash = '#/';
  });
  howBtn.addEventListener('click', () => {
    const open = howNote.hidden;
    closeNotes();
    if (open) setOpen(howNote, howBtn, true);
  });
  settingsBtn?.addEventListener('click', () => {
    const open = settingsNote?.hidden ?? true;
    closeNotes();
    if (open) setOpen(settingsNote, settingsBtn, true);
  });
  root.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-how-toggle], [data-how], [data-settings-toggle], [data-settings-panel], [data-pause], [data-mask]')) return;
    closeNotes();
  });
  pauseBtn.addEventListener('click', togglePause);
  mask.addEventListener('click', () => {
    if (manual || !howNote.hidden) togglePause();
  });

  const onVis = () => {
    setPauseHold('hidden', document.hidden);
    paintPause();
  };
  const onKey = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (event.key === 'Escape' || key === 'p') {
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      togglePause();
      return;
    }
    if (!isSimulationPaused()) return;
    const onControl = event.target instanceof HTMLElement && event.target.closest('button, a, input, textarea');
    if (onControl && (event.key === 'Enter' || event.key === ' ')) return;
    if (!GAME_KEYS.has(key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('keydown', onKey, true);
  if (document.hidden) setPauseHold('hidden', true);
  syncHow();

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
    stopPointer();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('keydown', onKey, true);
    game.unmount();
    clearPauseHolds();
    root.remove();
  };
}

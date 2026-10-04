const STORAGE_KEY = 'games-hub-v1';

export type ThemeName = 'dark' | 'light';

export interface GameStats {
  best: number;
  plays: number;
  settings: Record<string, string>;
}

interface Store {
  version: 1;
  theme?: ThemeName;
  games: Record<string, Partial<GameStats> & { difficulty?: string }>;
}

function emptyStore(): Store {
  return { version: 1, games: {} };
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version !== 1) return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function normalize(raw: (Partial<GameStats> & { difficulty?: string }) | undefined): GameStats {
  const settings = { ...(raw?.settings ?? {}) };
  if (raw?.difficulty && !settings.pace) settings.pace = raw.difficulty;
  return {
    best: raw?.best ?? 0,
    plays: raw?.plays ?? 0,
    settings,
  };
}

export function getTheme(): ThemeName {
  return readStore().theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: ThemeName): void {
  const store = readStore();
  store.theme = theme;
  writeStore(store);
}

export function applyTheme(theme: ThemeName = getTheme()): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function getGameStats(gameId: string): GameStats {
  return normalize(readStore().games[gameId]);
}

export function setGameSettings(gameId: string, settings: Record<string, string>): void {
  const store = readStore();
  const prev = normalize(store.games[gameId]);
  store.games[gameId] = { ...prev, settings: { ...prev.settings, ...settings } };
  writeStore(store);
}

export function saveRun(gameId: string, streak: number): GameStats {
  const store = readStore();
  const prev = normalize(store.games[gameId]);
  const next: GameStats = {
    best: Math.max(prev.best, streak),
    plays: prev.plays + 1,
    settings: prev.settings,
  };
  store.games[gameId] = next;
  writeStore(store);
  return next;
}

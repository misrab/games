const STORAGE_KEY = 'games-hub-v1';

export type ThemeName = 'dark' | 'light';

export interface BiasMeter {
  before: number;
  after: number;
  plays: number;
}

export interface GameStats {
  best: number;
  plays: number;
  settings: Record<string, string>;
  seenHow: boolean;
  biasMeters?: Record<string, BiasMeter>;
}

interface Store {
  version: 1;
  theme?: ThemeName;
  games: Record<string, Partial<GameStats> & { difficulty?: string; biasMeters?: Record<string, BiasMeter> }>;
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
    seenHow: raw?.seenHow === true,
    biasMeters: raw?.biasMeters ?? {},
  };
}

export function getBiasMeter(gameId: string, biasId: string): BiasMeter | undefined {
  return getGameStats(gameId).biasMeters?.[biasId];
}

export function saveBiasMeter(gameId: string, biasId: string, before: number, after: number): BiasMeter {
  const store = readStore();
  const prev = normalize(store.games[gameId]);
  const meters = { ...(prev.biasMeters ?? {}) };
  const next: BiasMeter = {
    before,
    after,
    plays: (meters[biasId]?.plays ?? 0) + 1,
  };
  meters[biasId] = next;
  store.games[gameId] = { ...prev, biasMeters: meters };
  writeStore(store);
  return next;
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

export function markHowSeen(gameId: string): void {
  const store = readStore();
  const prev = normalize(store.games[gameId]);
  if (prev.seenHow) return;
  store.games[gameId] = { ...prev, seenHow: true };
  writeStore(store);
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
    seenHow: prev.seenHow,
  };
  store.games[gameId] = next;
  writeStore(store);
  return next;
}

const STORAGE_KEY = 'games-hub-v1';

export interface GameStats {
  best: number;
  plays: number;
  level: number;
}

interface Store {
  version: 1;
  games: Record<string, GameStats>;
}

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, games: {} };
    const parsed = JSON.parse(raw) as Store;
    if (parsed.version !== 1) return { version: 1, games: {} };
    return parsed;
  } catch {
    return { version: 1, games: {} };
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getGameStats(gameId: string): GameStats {
  const store = readStore();
  return store.games[gameId] ?? { best: 0, plays: 0, level: 1 };
}

export function saveRun(gameId: string, clearedLevel: number, level: number): GameStats {
  const store = readStore();
  const prev = store.games[gameId] ?? { best: 0, plays: 0, level: 1 };
  const next: GameStats = {
    best: Math.max(prev.best, clearedLevel),
    plays: prev.plays + 1,
    level,
  };
  store.games[gameId] = next;
  writeStore(store);
  return next;
}

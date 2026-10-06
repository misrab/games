export interface GameOpts {
  gameId: string;
  settings: Record<string, string>;
}

export interface Game {
  mount(el: HTMLElement, opts: GameOpts): void;
  unmount(): void;
}

export interface SettingOption {
  id: string;
  labelKey: string;
  shortKey?: string;
}

export interface GameSetting {
  id: string;
  labelKey: string;
  default: string;
  options: SettingOption[];
}

/** live: a running sim (pause + how). turn: cards or a menu (how only when a round is open). */
export type GamePace = 'live' | 'turn';

export interface ShellBrief {
  titleKey: string;
  instructionsKey: string;
  controlsKey: string;
}

export interface GameMeta {
  id: string;
  titleKey: string;
  instructionsKey: string;
  controlsKey: string;
  tags: string[];
  pace?: GamePace;
  settings?: GameSetting[];
  load: () => Promise<{ default: Game }>;
}

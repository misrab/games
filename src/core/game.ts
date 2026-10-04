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
}

export interface GameSetting {
  id: string;
  labelKey: string;
  default: string;
  options: SettingOption[];
}

export interface GameMeta {
  id: string;
  titleKey: string;
  instructionsKey: string;
  tags: string[];
  settings?: GameSetting[];
  load: () => Promise<{ default: Game }>;
}

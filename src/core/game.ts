export interface GameOpts {
  gameId: string;
}

export interface Game {
  mount(el: HTMLElement, opts: GameOpts): void;
  unmount(): void;
}

export interface GameMeta {
  id: string;
  titleKey: string;
  tags: string[];
  load: () => Promise<{ default: Game }>;
}

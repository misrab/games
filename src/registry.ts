import type { GameMeta } from './core/game';

export const registry: GameMeta[] = [
  {
    id: 'penguin-pursuit',
    titleKey: 'penguin.title',
    tags: ['spatial', 'brain'],
    load: () => import('./games/penguin-pursuit/index'),
  },
];

export function findGameMeta(id: string): GameMeta | undefined {
  return registry.find((g) => g.id === id);
}

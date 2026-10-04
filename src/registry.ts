import type { GameMeta } from './core/game';

export const registry: GameMeta[] = [
  {
    id: 'chicken-pursuit',
    titleKey: 'chicken.title',
    instructionsKey: 'chicken.instructions',
    tags: ['spatial', 'brain'],
    settings: [
      {
        id: 'pace',
        labelKey: 'chicken.pace',
        default: 'normal',
        options: [
          { id: 'easy', labelKey: 'chicken.pace.easy' },
          { id: 'normal', labelKey: 'chicken.pace.normal' },
          { id: 'hard', labelKey: 'chicken.pace.hard' },
        ],
      },
    ],
    load: () => import('./games/chicken-pursuit/index'),
  },
  {
    id: 'void-run',
    titleKey: 'void.title',
    instructionsKey: 'void.instructions',
    tags: ['action', 'space'],
    load: () => import('./games/void-run/index'),
  },
];

export function findGameMeta(id: string): GameMeta | undefined {
  return registry.find((g) => g.id === id);
}

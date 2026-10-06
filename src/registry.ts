import type { GameMeta } from './core/game';

export const registry: GameMeta[] = [
  {
    id: 'chicken-pursuit',
    titleKey: 'chicken.title',
    instructionsKey: 'chicken.instructions',
    controlsKey: 'chicken.controls',
    tags: ['spatial', 'brain'],
    settings: [
      {
        id: 'level',
        labelKey: 'chicken.level',
        default: '3',
        options: [
          { id: '1', labelKey: 'chicken.level.1', shortKey: 'chicken.level.1.short' },
          { id: '2', labelKey: 'chicken.level.2', shortKey: 'chicken.level.2.short' },
          { id: '3', labelKey: 'chicken.level.3', shortKey: 'chicken.level.3.short' },
          { id: '4', labelKey: 'chicken.level.4', shortKey: 'chicken.level.4.short' },
          { id: '5', labelKey: 'chicken.level.5', shortKey: 'chicken.level.5.short' },
        ],
      },
    ],
    load: () => import('./games/chicken-pursuit/index'),
  },
  {
    id: 'void-run',
    titleKey: 'void.title',
    instructionsKey: 'void.instructions',
    controlsKey: 'void.controls',
    tags: ['action', 'space'],
    load: () => import('./games/void-run/index'),
  },
  {
    id: 'bias',
    titleKey: 'cog.title',
    instructionsKey: 'cog.instructions',
    controlsKey: 'cog.controls',
    tags: ['brain'],
    load: () => import('./games/bias/index'),
  },
];

export function findGameMeta(id: string): GameMeta | undefined {
  return registry.find((g) => g.id === id);
}

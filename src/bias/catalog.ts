import type { Game } from '../core/game';

export interface BiasSpec {
  id: string;
  gameId: string;
  load: () => Promise<{ default: Game }>;
}

export const curriculum: BiasSpec[] = [
  { id: 'anchoring', gameId: 'anchor', load: () => import('../games/bias/anchor/index') },
  { id: 'availability', gameId: 'availability', load: () => import('../games/bias/availability/index') },
  { id: 'representativeness', gameId: 'representativeness', load: () => import('../games/bias/representativeness/index') },
  { id: 'confirmation', gameId: 'confirmation', load: () => import('../games/bias/confirmation/index') },
  { id: 'sunk', gameId: 'sunk-cost', load: () => import('../games/bias/sunk-cost/index') },
  { id: 'overconfidence', gameId: 'overconfidence', load: () => import('../games/bias/overconfidence/index') },
  { id: 'blind', gameId: 'blind-spot', load: () => import('../games/bias/blind-spot/index') },
  { id: 'framing', gameId: 'framing', load: () => import('../games/bias/framing/index') },
  { id: 'loss', gameId: 'loss-aversion', load: () => import('../games/bias/loss-aversion/index') },
  { id: 'hindsight', gameId: 'hindsight', load: () => import('../games/bias/hindsight/index') },
  { id: 'planning', gameId: 'planning', load: () => import('../games/bias/planning/index') },
];

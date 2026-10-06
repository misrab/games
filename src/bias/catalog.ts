import type { Game } from '../core/game';

export interface BiasSpec {
  id: string;
  gameId: string;
  instructionsKey: string;
  controlsKey: string;
  load: () => Promise<{ default: Game }>;
}

export const curriculum: BiasSpec[] = [
  { id: 'anchoring', gameId: 'anchor', instructionsKey: 'anchor.intro.body', controlsKey: 'sub.anchor.controls', load: () => import('../games/bias/anchor/index') },
  { id: 'availability', gameId: 'availability', instructionsKey: 'avail.intro', controlsKey: 'sub.avail.controls', load: () => import('../games/bias/availability/index') },
  { id: 'representativeness', gameId: 'representativeness', instructionsKey: 'rep.intro', controlsKey: 'sub.rep.controls', load: () => import('../games/bias/representativeness/index') },
  { id: 'confirmation', gameId: 'confirmation', instructionsKey: 'confirm.intro', controlsKey: 'sub.confirm.controls', load: () => import('../games/bias/confirmation/index') },
  { id: 'sunk', gameId: 'sunk-cost', instructionsKey: 'sunk.intro', controlsKey: 'sub.sunk.controls', load: () => import('../games/bias/sunk-cost/index') },
  { id: 'overconfidence', gameId: 'overconfidence', instructionsKey: 'over.intro', controlsKey: 'sub.over.controls', load: () => import('../games/bias/overconfidence/index') },
  { id: 'blind', gameId: 'blind-spot', instructionsKey: 'blind.intro', controlsKey: 'sub.blind.controls', load: () => import('../games/bias/blind-spot/index') },
  { id: 'framing', gameId: 'framing', instructionsKey: 'frame.intro', controlsKey: 'sub.frame.controls', load: () => import('../games/bias/framing/index') },
  { id: 'loss', gameId: 'loss-aversion', instructionsKey: 'loss.intro', controlsKey: 'sub.loss.controls', load: () => import('../games/bias/loss-aversion/index') },
  { id: 'hindsight', gameId: 'hindsight', instructionsKey: 'hind.intro', controlsKey: 'sub.hind.controls', load: () => import('../games/bias/hindsight/index') },
  { id: 'planning', gameId: 'planning', instructionsKey: 'plan.intro', controlsKey: 'sub.plan.controls', load: () => import('../games/bias/planning/index') },
];

/** Biases this series will cover. Flip `live` and add `src/games/<gameId>` when a game exists. */
export interface BiasSpec {
  id: string;
  gameId: string;
  live: boolean;
}

export const curriculum: BiasSpec[] = [
  { id: 'anchoring', gameId: 'anchor', live: true },
  { id: 'availability', gameId: 'availability', live: false },
  { id: 'representativeness', gameId: 'representativeness', live: false },
  { id: 'confirmation', gameId: 'confirmation', live: false },
  { id: 'sunk', gameId: 'sunk-cost', live: false },
  { id: 'overconfidence', gameId: 'overconfidence', live: false },
  { id: 'blind', gameId: 'blind-spot', live: false },
  { id: 'framing', gameId: 'framing', live: false },
  { id: 'loss', gameId: 'loss-aversion', live: false },
  { id: 'hindsight', gameId: 'hindsight', live: false },
  { id: 'planning', gameId: 'planning', live: false },
];

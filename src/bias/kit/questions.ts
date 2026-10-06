export interface EstimateQuestion {
  id: string;
  truth: number;
  min: number;
  max: number;
  low: number;
  high: number;
}

/** Shared trivia used by anchoring and overconfidence subgames. */
export const estimateQuestions: EstimateQuestion[] = [
  { id: 'nile', truth: 6650, min: 0, max: 20000, low: 2000, high: 15000 },
  { id: 'bones', truth: 206, min: 0, max: 1000, low: 50, high: 700 },
  { id: 'whale', truth: 30, min: 0, max: 100, low: 8, high: 80 },
  { id: 'sound', truth: 343, min: 0, max: 3000, low: 100, high: 2000 },
  { id: 'eiffel', truth: 330, min: 0, max: 1500, low: 100, high: 1000 },
  { id: 'piano', truth: 88, min: 0, max: 400, low: 30, high: 300 },
];

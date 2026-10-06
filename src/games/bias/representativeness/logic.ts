export interface ProbCase {
  id: string;
  truth: number;
  options: [number, number, number];
}

export const cases: ProbCase[] = [
  { id: 'taxi', truth: 41, options: [15, 41, 80] },
  { id: 'engineer', truth: 30, options: [10, 30, 70] },
  { id: 'disease', truth: 8, options: [8, 50, 95] },
  { id: 'linda', truth: 20, options: [20, 55, 85] },
  { id: 'birth', truth: 50, options: [20, 50, 80] },
  { id: 'sample', truth: 16, options: [16, 50, 84] },
];

export function biasFromGuess(guess: number, truth: number): number {
  return Math.round(Math.min(100, Math.abs(guess - truth)));
}

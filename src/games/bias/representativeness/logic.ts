export function taxiBlueRate(): number {
  const pBlue = 0.15;
  const pSaysBlueGivenBlue = 0.8;
  const pSaysBlueGivenGreen = 0.2;
  return (pSaysBlueGivenBlue * pBlue) / (pSaysBlueGivenBlue * pBlue + pSaysBlueGivenGreen * (1 - pBlue));
}

export function biasFromGuess(guess: number, truth: number): number {
  return Math.round(Math.min(100, Math.abs(guess - truth) * 100));
}

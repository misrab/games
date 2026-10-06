export function planningError(estimateSec: number, actualSec: number): number {
  if (actualSec <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, ((estimateSec - actualSec) / actualSec) * 100)));
}

export function meanError(errors: number[]): number {
  return errors.length === 0 ? 0 : Math.round(errors.reduce((a, b) => a + b, 0) / errors.length);
}

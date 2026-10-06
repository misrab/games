export function recallShift(recorded: number, recalled: number): number {
  return Math.round(Math.min(100, Math.abs(recalled - recorded) * 10));
}

export function meanShift(shifts: number[]): number {
  return shifts.length === 0 ? 0 : Math.round(shifts.reduce((a, b) => a + b, 0) / shifts.length);
}

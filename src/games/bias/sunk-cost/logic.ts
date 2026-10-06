export interface Mine {
  gold: number;
  dug: number;
  costPerDig: number;
}

export function shouldLeave(m: Mine): boolean {
  const left = m.gold - m.dug * m.costPerDig;
  const next = left - m.costPerDig;
  return next < m.costPerDig * 0.5;
}

export function sunkBias(choices: { dig: boolean; shouldLeave: boolean }[]): number {
  let bad = 0;
  for (const c of choices) {
    if (c.dig && c.shouldLeave) bad += 1;
  }
  return Math.round((bad / choices.length) * 100);
}

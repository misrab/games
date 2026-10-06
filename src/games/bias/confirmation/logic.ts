export type RuleId = 'asc' | 'even' | 'mod3' | 'desc' | 'odd' | 'under';

export interface Rule {
  id: RuleId;
  labelKey: string;
  fits: (a: number, b: number, c: number) => boolean;
}

export const rules: Rule[] = [
  { id: 'asc', labelKey: 'confirm.rule.asc', fits: (a, b, c) => a < b && b < c },
  { id: 'even', labelKey: 'confirm.rule.even', fits: (a, b, c) => a % 2 === 0 && b % 2 === 0 && c % 2 === 0 },
  { id: 'mod3', labelKey: 'confirm.rule.mod3', fits: (a, b, c) => a % 3 === 0 && b % 3 === 0 && c % 3 === 0 },
  { id: 'desc', labelKey: 'confirm.rule.desc', fits: (a, b, c) => a > b && b > c },
  { id: 'odd', labelKey: 'confirm.rule.odd', fits: (a, b, c) => a % 2 !== 0 && b % 2 !== 0 && c % 2 !== 0 },
  { id: 'under', labelKey: 'confirm.rule.under', fits: (a, b, c) => a < 10 && b < 10 && c < 10 },
];

export function biasRate(attempts: boolean[]): number {
  if (attempts.length === 0) return 0;
  const confirmOnly = attempts.filter((x) => x).length;
  return Math.round((confirmOnly / attempts.length) * 100);
}

export interface Bet {
  win: number;
  lose: number;
}

export function acceptRate(accepts: boolean[]): number {
  const no = accepts.filter((x) => !x).length;
  return Math.round((no / accepts.length) * 100);
}

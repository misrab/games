export function scaleHtml(
  marks: { cls: string; label: string; at: number; text: string }[],
): string {
  const sorted = [...marks].sort((a, b) => a.at - b.at);
  return `
    <div class="bk__scale" aria-hidden="true">
      ${sorted.map((m) => `<span class="bk__mark bk__mark--${m.cls}" style="left:${Math.max(0, Math.min(100, m.at))}%"></span>`).join('')}
    </div>
    <ul class="bk__legend">
      ${sorted.map((m) => `<li class="bk__key bk__key--${m.cls}">${m.label} <b>${m.text}</b></li>`).join('')}
    </ul>`;
}

export function gridHtml(on: number, total = 100): string {
  const n = Math.max(0, Math.min(total, Math.round(on)));
  return `<div class="bk__grid" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<span class="bk__cell${i < n ? ' is-on' : ''}"></span>`).join('')}</div>`;
}

export function meterPair(beforePct: number, afterPct: number, beforeLabel: string, afterLabel: string): string {
  const bar = (pct: number, label: string) =>
    `<div><span class="bk__note">${label}</span><div class="bk__bar"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></div></div>`;
  return `<div class="bk__meter">${bar(beforePct, beforeLabel)}${bar(afterPct, afterLabel)}</div>`;
}

export function wheelHtml(value: number, spin = false, rotationDeg = 0): string {
  const to = rotationDeg + 720;
  return `
    <svg class="bk__wheel${spin ? ' is-spin' : ''}" style="${spin ? `--bk-wheel-to:${to}deg` : ''}" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="var(--surface)" stroke="var(--border)" stroke-width="2"/>
      <path d="M50 50 L50 8 A42 42 0 0 1 92 50 Z" fill="var(--accent)" opacity="0.35"/>
      <path d="M50 50 L92 50 A42 42 0 0 1 50 92 Z" fill="var(--danger)" opacity="0.35"/>
      <circle cx="50" cy="50" r="6" fill="var(--fg)"/>
      <text x="50" y="54" text-anchor="middle" font-size="14" font-weight="700" fill="var(--fg)">${value}</text>
    </svg>`;
}

export function peopleHtml(live: number, dead: number): string {
  const liveN = Math.max(0, live);
  const deadN = Math.max(0, dead);
  return `<div class="bk__people">${Array.from({ length: liveN }, () => '<span class="bk__person is-live"></span>').join('')}${Array.from({ length: deadN }, () => '<span class="bk__person is-dead"></span>').join('')}</div>`;
}

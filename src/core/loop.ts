export interface LoopHandlers {
  update(dt: number): void;
  render(alpha: number): void;
}

const FIXED_STEP = 1 / 60;
const MAX_STEPS = 5;

const holds = new Set<string>();
const kickers = new Set<() => void>();

export function isSimulationPaused(): boolean {
  return holds.size > 0;
}

function kick(): void {
  for (const fn of kickers) fn();
}

export function setPauseHold(id: string, on: boolean): void {
  const before = holds.size > 0;
  if (on) holds.add(id);
  else holds.delete(id);
  if (before && holds.size === 0) kick();
}

export function clearPauseHolds(): void {
  const before = holds.size > 0;
  holds.clear();
  if (before) kick();
}

export function createLoop(handlers: LoopHandlers): { start(): void; stop(): void } {
  let rafId = 0;
  let last = 0;
  let acc = 0;
  let started = false;

  const frame = (now: number) => {
    if (!started) return;
    rafId = requestAnimationFrame(frame);
    if (isSimulationPaused()) {
      last = 0;
      acc = 0;
      handlers.render(0);
      return;
    }
    if (last === 0) {
      last = now;
      return;
    }
    let delta = (now - last) / 1000;
    last = now;
    if (delta > 0.25) delta = 0.25;
    acc += delta;

    let steps = 0;
    while (acc >= FIXED_STEP && steps < MAX_STEPS) {
      handlers.update(FIXED_STEP);
      acc -= FIXED_STEP;
      steps++;
    }

    const alpha = acc / FIXED_STEP;
    handlers.render(alpha);
  };

  const ensure = () => {
    if (!started) return;
    cancelAnimationFrame(rafId);
    last = 0;
    acc = 0;
    rafId = requestAnimationFrame(frame);
  };

  return {
    start() {
      if (started) return;
      started = true;
      kickers.add(ensure);
      ensure();
    },
    stop() {
      started = false;
      kickers.delete(ensure);
      cancelAnimationFrame(rafId);
    },
  };
}

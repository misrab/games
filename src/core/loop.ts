export interface LoopHandlers {
  update(dt: number): void;
  render(alpha: number): void;
}

const FIXED_STEP = 1 / 60;
const MAX_STEPS = 5;

export function createLoop(handlers: LoopHandlers): { start(): void; stop(): void } {
  let rafId = 0;
  let last = 0;
  let acc = 0;
  let running = false;

  const frame = (now: number) => {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
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

  return {
    start() {
      if (running) return;
      running = true;
      last = 0;
      acc = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}

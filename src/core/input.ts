export type InputAction = 'up' | 'down' | 'left' | 'right' | 'pause';

export interface InputBinding {
  onAction(action: InputAction): void;
}

const KEY_MAP: Record<string, InputAction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  p: 'pause',
  Escape: 'pause',
};

export function bindInput(binding: InputBinding): () => void {
  const onKey = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key];
    if (!action) return;
    e.preventDefault();
    binding.onAction(action);
  };

  let touchStart: { x: number; y: number } | null = null;

  const onTouchStart = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    if (ax > ay) binding.onAction(dx > 0 ? 'right' : 'left');
    else binding.onAction(dy > 0 ? 'down' : 'up');
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);
  };
}

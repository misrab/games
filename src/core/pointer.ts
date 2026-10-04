export type PointerKind = 'desktop' | 'touch';

export function pointerKind(): PointerKind {
  return window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop';
}

export function watchPointer(onChange: (kind: PointerKind) => void): () => void {
  const query = window.matchMedia('(pointer: coarse)');
  const notify = () => onChange(query.matches ? 'touch' : 'desktop');
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}

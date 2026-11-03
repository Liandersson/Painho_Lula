/** Bound held-key work without queuing stale moves after the user releases a key. */
export function createDirectionGate(intervalMs = 80) {
  let held = '',
    last = -Infinity;
  return {
    accept(key: string, now: number) {
      if (key === held && now - last < intervalMs) return false;
      held = key;
      last = now;
      return true;
    },
    release(key?: string) {
      if (!key || key === held) {
        held = '';
        last = -Infinity;
      }
    },
  };
}

/** Pointer hover and remote focus share one target. Never steal focus from an open keyboard. */
export function installPointerNavigation(doc: Document = document) {
  let previousX = NaN,
    previousY = NaN,
    last = -Infinity;
  const onMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (Math.abs(event.clientX - previousX) + Math.abs(event.clientY - previousY) < 3) return;
    previousX = event.clientX;
    previousY = event.clientY;
    const now = performance.now();
    if (now - last < 60) return;
    last = now;
    const active = doc.activeElement as HTMLElement | null;
    if (
      active?.isContentEditable ||
      active?.matches('textarea,input:not([readonly]):not([type="range"]):not([type="checkbox"]):not([type="radio"])')
    )
      return;
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>(
            'button,a[href],input[type="checkbox"],input[type="radio"],[role="slider"],[tabindex="0"]',
          )
        : null;
    if (
      !target ||
      target.matches(':disabled,[aria-disabled="true"]') ||
      target.closest('[inert],[hidden],[aria-hidden="true"]')
    )
      return;
    doc.documentElement.setAttribute('data-tv-input', 'pointer');
    if (target !== active) target.focus({ preventScroll: true });
  };
  doc.addEventListener('pointermove', onMove, { passive: true });
  return () => doc.removeEventListener('pointermove', onMove);
}

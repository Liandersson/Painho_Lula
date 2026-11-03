// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { createDirectionGate, installPointerNavigation } from './input';
afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
it('moves immediately, caps held arrows, and never defers movement beyond key release', () => {
  const gate = createDirectionGate();
  expect(gate.accept('Right', 0)).toBe(true);
  expect(gate.accept('Right', 20)).toBe(false);
  expect(gate.accept('Right', 80)).toBe(true);
  expect(gate.accept('Left', 81)).toBe(true);
  gate.release('Left');
  expect(gate.accept('Left', 82)).toBe(true);
  gate.release();
  expect(gate.accept('Left', 83)).toBe(true);
});
it('focuses hovered buttons without scrolling and does not steal the on-screen keyboard', () => {
  const button = document.createElement('button');
  document.body.append(button);
  const input = document.createElement('input');
  document.body.append(input);
  const focus = vi.spyOn(button, 'focus');
  const dispose = installPointerNavigation();
  button.dispatchEvent(
    new PointerEvent('pointermove', { clientX: 10, clientY: 10, pointerType: 'mouse', bubbles: true }),
  );
  expect(document.activeElement).toBe(button);
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  input.focus();
  vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 100);
  button.dispatchEvent(
    new PointerEvent('pointermove', { clientX: 20, clientY: 20, pointerType: 'mouse', bubbles: true }),
  );
  expect(document.activeElement).toBe(input);
  dispose();
});
it('ignores disabled and touch targets and removes its listener on dispose', () => {
  const button = document.createElement('button');
  button.disabled = true;
  document.body.append(button);
  const dispose = installPointerNavigation();
  button.dispatchEvent(
    new PointerEvent('pointermove', { clientX: 10, clientY: 10, pointerType: 'mouse', bubbles: true }),
  );
  expect(document.activeElement).not.toBe(button);
  button.disabled = false;
  button.dispatchEvent(
    new PointerEvent('pointermove', { clientX: 30, clientY: 10, pointerType: 'touch', bubbles: true }),
  );
  expect(document.activeElement).not.toBe(button);
  dispose();
  button.dispatchEvent(
    new PointerEvent('pointermove', { clientX: 50, clientY: 10, pointerType: 'mouse', bubbles: true }),
  );
  expect(document.activeElement).not.toBe(button);
});

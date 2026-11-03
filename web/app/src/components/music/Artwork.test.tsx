// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { Artwork } from './Artwork';

it('clears a pending retry when a cover is replaced and resets its loaded state', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.useFakeTimers();
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    act(() => root.render(<Artwork src="https://example.com/a.jpg" displayWidth={100} />));
    act(() => container.querySelector('img')!.dispatchEvent(new Event('load')));
    expect(container.querySelector('img')!.hasAttribute('data-loaded')).toBe(true);
    act(() => container.querySelector('img')!.dispatchEvent(new Event('error')));
    act(() => root.render(<Artwork src="https://example.com/b.jpg" displayWidth={100} />));
    expect(container.querySelector('img')!.hasAttribute('data-loaded')).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    act(() => container.querySelector('img')!.dispatchEvent(new Event('error')));
    act(() => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
  } finally { container.remove(); vi.useRealTimers(); }
});

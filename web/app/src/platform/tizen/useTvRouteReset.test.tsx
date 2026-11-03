// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router';
import { expect, it, vi } from 'vitest';
import { useTvRouteReset } from './useTvRouteReset';
vi.mock('./services', () => ({ isTizenBuild: true }));

it('opens a new TV page at the top while keeping scroll during in-page query changes', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const container = document.createElement('div');
  document.body.append(container);
  let navigate: ReturnType<typeof useNavigate>;
  function View() {
    useTvRouteReset();
    navigate = useNavigate();
    return <main id="scrollable-page" />;
  }
  const root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={['/settings']}>
        <View />
      </MemoryRouter>,
    ),
  );
  const page = container.querySelector('main')!;
  page.scrollTop = 900;
  act(() => navigate('/home'));
  expect(page.scrollTop).toBe(0);
  page.scrollTop = 300;
  act(() => navigate('/home?q=relax'));
  expect(page.scrollTop).toBe(300);
  act(() => navigate('/favorites'));
  expect(page.scrollTop).toBe(0);
  act(() => root.unmount());
  container.remove();
});

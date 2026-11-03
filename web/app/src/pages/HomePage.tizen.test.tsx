// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import HomePage from './HomePage';
import { useLocalRecentlyPlayed } from '@/platform/tizen/recentlyPlayed';
import { useTvPreferences } from '@/platform/tizen/preferences';
import type { Track } from '@/data/music/types';
const mocks = vi.hoisted(() => ({ radio: vi.fn(), search: vi.fn(), playTracks: vi.fn(), shelves: [] as unknown[] }));
vi.mock('@/platform/tizen/services', () => ({ isTizenBuild: true }));
vi.mock('@/state/player', () => ({
  getAudio: () => null,
  usePlayer: Object.assign((select: (s: { nowPlaying: null }) => unknown) => select({ nowPlaying: null }), {
    getState: () => ({ playTracks: mocks.playTracks }),
  }),
}));
vi.mock('@/data/music/api', () => ({
  fetchRadio: (...args: unknown[]) => mocks.radio(...args),
  fetchSearch: (...args: unknown[]) => mocks.search(...args),
}));
vi.mock('@/data/music/queries', () => ({
  useYouTubeReady: () => ({ ready: true, missing: false }),
  useLibrary: () => ({}),
  useHome: () => ({
    hasNextPage: false,
    isPending: false,
    data: {
      pages: [
        {
          data: [{ title: 'Playlists', layout: 'square', items: [{ id: 'playlist', kind: 'playlist', artists: [] }] }],
        },
      ],
    },
  }),
}));
vi.mock('@/components/music/ShelfView', () => ({
  TrackShelf: ({ title, tracks }: { title: string; tracks: Track[] }) => (
    <section aria-label={title}>
      {tracks.map((t) => (
        <span key={t.videoId} data-track={t.videoId} />
      ))}
    </section>
  ),
  Shelves: ({ shelves }: { shelves: unknown[] }) => {
    mocks.shelves = shelves;
    return null;
  },
}));
const track = (id: string): Track => ({
  videoId: id,
  title: `Song ${id}`,
  artists: [{ name: 'Maria', id: null }],
  album: null,
  durationSec: 120,
  explicit: false,
  thumbnail: null,
  index: null,
  plays: null,
});
let root: ReturnType<typeof createRoot>, container: HTMLDivElement, client: QueryClient;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useLocalRecentlyPlayed.setState({ entries: [] });
  useTvPreferences.setState({ favorites: [], hidden: [], topics: ['brasil', 'relax'], discovery: true });
  mocks.radio.mockReset().mockResolvedValue({ candidates: [], seedIsVideo: false });
  mocks.search.mockReset().mockResolvedValue({ songs: [], top: [] });
});
afterEach(() => {
  act(() => root.unmount());
  client.clear();
  container.remove();
});
const render = () =>
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  );
it('offers search and themes on a fresh TV without inventing personal listening history', () => {
  render();
  expect(container.textContent).toContain('Sua próxima música favorita');
  expect(container.textContent).toContain('Encontrar uma música');
  expect(container.querySelectorAll('[data-track]')).toHaveLength(0);
  expect(mocks.radio).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-label="Seu momento"]')).not.toBeNull();
});
it('keeps local favorites and recent starts visible and uses only qualified listening for radio', async () => {
  useLocalRecentlyPlayed.setState({ entries: [{ track: track('recent'), playedAt: Date.now(), count: 0, score: 0 }] });
  useTvPreferences.setState({ favorites: [track('fav')] });
  render();
  expect(container.querySelector('[data-track="recent"]')).not.toBeNull();
  expect(container.querySelector('[data-track="fav"]')).not.toBeNull();
  expect(mocks.radio).toHaveBeenCalledWith('fav');
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const play = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Tocar meu mix'))!;
  act(() => play.click());
  expect(mocks.playTracks).toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ videoId: 'fav' })]),
    0,
    expect.objectContaining({ title: 'Seu mix' }),
  );
});
it('loads a chosen theme on demand and filters hidden recommendations', async () => {
  mocks.search.mockResolvedValue({
    songs: [
      {
        kind: 'song',
        id: 'hidden',
        title: 'Hidden',
        artists: [],
        album: null,
        thumbnail: null,
        durationSec: 120,
        explicit: false,
      },
      {
        kind: 'song',
        id: 'fresh',
        title: 'Fresh',
        artists: [],
        album: null,
        thumbnail: null,
        durationSec: 120,
        explicit: false,
      },
    ],
    top: [],
  });
  useTvPreferences.setState({ hidden: ['hidden'] });
  render();
  expect(mocks.search).not.toHaveBeenCalled();
  const relax = [...container.querySelectorAll('button')].find((b) => b.textContent === 'Relaxar')!;
  act(() => relax.click());
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  expect(mocks.search).toHaveBeenCalledWith('música relaxante acústica');
  expect(container.querySelector('[data-track="fresh"]')).not.toBeNull();
  expect(container.querySelector('[data-track="hidden"]')).toBeNull();
  const play = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Tocar seleção'))!;
  act(() => play.click());
  expect(mocks.playTracks).toHaveBeenLastCalledWith(
    [expect.objectContaining({ videoId: 'fresh' })],
    0,
    expect.objectContaining({ title: 'Relaxar' }),
  );
});

it('keeps cached discoveries out of the personal mix when discovery is disabled', () => {
  useTvPreferences.setState({ favorites: [track('fav')], discovery: false });
  client.setQueryData(['tv', 'for-you', 'fav'], {
    candidates: [{ track: track('cached'), isVideo: false }],
    seedIsVideo: false,
  });
  render();
  const play = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Tocar meu mix'))!;
  act(() => play.click());
  expect(mocks.playTracks).toHaveBeenLastCalledWith(
    [expect.objectContaining({ videoId: 'fav' })],
    0,
    expect.objectContaining({ title: 'Seu mix' }),
  );
  expect(mocks.radio).not.toHaveBeenCalled();
});

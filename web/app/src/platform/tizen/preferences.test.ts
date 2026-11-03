// @vitest-environment happy-dom
import { expect, it } from 'vitest';
import type { Track } from '@/data/music/types';
import { createTvPreferences, TV_PREFERENCES_KEY } from './preferences';
const track = (id: string): Track => ({
  videoId: id,
  title: id,
  artists: [{ name: 'Artist', id: null }],
  album: null,
  durationSec: 120,
  explicit: false,
  thumbnail: null,
  index: null,
  plays: null,
});
const storage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
};
it('persists favorites, hidden tracks and topics, without duplicates', () => {
  const memory = storage(),
    store = createTvPreferences(memory);
  store.getState().toggleFavorite(track('A'));
  store.getState().toggleFavorite(track('B'));
  store.getState().toggleFavorite(track('A'));
  expect(store.getState().favorites.map((t) => t.videoId)).toEqual(['B']);
  store.getState().hide('B');
  expect(store.getState().favorites).toEqual([]);
  store.getState().toggleFavorite(track('B'));
  expect(store.getState().hidden).toEqual([]);
  store.getState().toggleTopic('forro');
  store.getState().setAudioMode('compatible');
  store.getState().setLeveling(true);
  const restored = createTvPreferences(memory).getState();
  expect(restored.favorites[0]?.videoId).toBe('B');
  expect(restored.topics).toContain('forro');
  expect(restored.audioMode).toBe('compatible');
  expect(restored.leveling).toBe(true);
});
it('sanitizes damaged or oversized persisted data and survives unavailable storage', () => {
  const memory = storage();
  memory.setItem(
    TV_PREFERENCES_KEY,
    JSON.stringify({
      favorites: [null, track('A'), track('A'), { videoId: 'bad' }],
      hidden: ['X', 'X', null, 7],
      topics: ['forro', 'bogus', 'forro'],
      audioMode: 'lossless',
      discovery: 'yes',
    }),
  );
  const store = createTvPreferences(memory);
  expect(store.getState().favorites).toHaveLength(1);
  expect(store.getState().hidden).toEqual(['X']);
  expect(store.getState().topics).toEqual(['forro']);
  expect(store.getState().audioMode).toBe('quality');
  const broken = createTvPreferences({
    getItem: () => {
      throw Error('blocked');
    },
    setItem: () => {
      throw Error('full');
    },
  });
  expect(() => broken.getState().toggleFavorite(track('A'))).not.toThrow();
  expect(broken.getState().favorites).toHaveLength(1);
});
it('bounds saved metadata and never favorites an unavailable track', () => {
  const store = createTvPreferences(null);
  for (let i = 0; i < 210; i++) store.getState().toggleFavorite(track(String(i)));
  expect(store.getState().favorites).toHaveLength(200);
  store.getState().toggleFavorite({ ...track('missing'), unavailable: 'missing' });
  expect(store.getState().favorites.some((t) => t.videoId === 'missing')).toBe(false);
  for (let i = 0; i < 510; i++) store.getState().hide(String(i));
  expect(store.getState().hidden).toHaveLength(500);
  store.getState().restoreHidden();
  expect(store.getState().hidden).toEqual([]);
});

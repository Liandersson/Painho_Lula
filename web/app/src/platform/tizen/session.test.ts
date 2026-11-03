// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import type { Track } from '@/data/music/types';
import { readSavedSession, startSessionPersistence, TV_SESSION_KEY } from './session';
const mocks = vi.hoisted(() => ({ state: {} as Record<string, unknown>, audio: null as HTMLAudioElement | null }));
vi.mock('@/state/player', () => ({ getAudio: () => mocks.audio, usePlayer: { getState: () => mocks.state } }));
const track: Track = {
  videoId: 'song',
  title: 'Song',
  artists: [{ name: 'Artist', id: null }],
  durationSec: 180,
  explicit: false,
  thumbnail: null,
  album: null,
  index: null,
  plays: null,
};
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  mocks.audio = null;
});
it('restores a bounded valid session and clamps its position inside the track', () => {
  const now = Date.now();
  const raw = JSON.stringify({
    tracks: [track, ...Array.from({ length: 45 }, () => track)],
    seconds: 999,
    savedAt: now,
  });
  const session = readSavedSession({ getItem: () => raw }, now);
  expect(session?.tracks).toHaveLength(30);
  expect(session?.seconds).toBe(179);
  expect(
    readSavedSession(
      { getItem: () => JSON.stringify({ tracks: [track], seconds: 0, savedAt: now - 31 * 86400000 }) },
      now,
    ),
  ).toBeNull();
  expect(readSavedSession({ getItem: () => '{broken' })).toBeNull();
  expect(readSavedSession(null)).toBeNull();
});
it('writes at most once per sample, flushes on cleanup and never writes failed/loading tracks', () => {
  vi.useFakeTimers();
  const storage = { setItem: vi.fn() };
  const audio = document.createElement('audio');
  audio.currentTime = 42;
  mocks.audio = audio;
  mocks.state = { status: 'playing', nowPlaying: { videoId: 'song' }, queue: [{ track }], index: 0 };
  const dispose = startSessionPersistence(storage);
  vi.advanceTimersByTime(10_000);
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(10_000);
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  audio.currentTime = 52;
  vi.advanceTimersByTime(10_000);
  expect(storage.setItem).toHaveBeenCalledTimes(2);
  expect(JSON.parse(storage.setItem.mock.calls[1]![1]).seconds).toBe(52);
  mocks.state.status = 'loading';
  audio.currentTime = 60;
  vi.advanceTimersByTime(10_000);
  expect(storage.setItem).toHaveBeenCalledTimes(2);
  dispose();
  expect(vi.getTimerCount()).toBe(0);
});
it('tolerates full storage and omits malformed sessions', () => {
  vi.useFakeTimers();
  const audio = document.createElement('audio');
  mocks.audio = audio;
  mocks.state = { status: 'paused', nowPlaying: { videoId: 'song' }, queue: [{ track }], index: 0 };
  const dispose = startSessionPersistence({
    setItem: () => {
      throw Error('quota');
    },
  });
  expect(() => vi.advanceTimersByTime(10_000)).not.toThrow();
  dispose();
  expect(
    readSavedSession({ getItem: () => JSON.stringify({ tracks: [null], seconds: 5, savedAt: Date.now() }) }),
  ).toBeNull();
});

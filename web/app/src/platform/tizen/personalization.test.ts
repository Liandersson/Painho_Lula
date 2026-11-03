import { expect, it } from 'vitest';
import type { Track, Shelf } from '@/data/music/types';
import { artistKey, personalizedShelves, recommendedTracks, tasteProfile } from './personalization';
const track = (id: string, artist = 'Artista'): Track => ({
  videoId: id,
  title: id,
  artists: [{ name: artist, id: null }],
  album: null,
  durationSec: 120,
  explicit: false,
  thumbnail: null,
  index: null,
  plays: null,
});
const now = 1700000000000;
it('learns from qualified listens and favorites but not track starts, with accent normalization', () => {
  const entries = [
    { track: track('a', 'João - Topic'), count: 0, score: 0, playedAt: now },
    { track: track('b', 'Maria'), count: 4, score: 4, playedAt: now },
  ];
  expect(tasteProfile(entries, [], [], now).artists.map((a) => a.name)).toEqual(['Maria']);
  expect(tasteProfile(entries, [track('c', 'João')], [], now).artists[0]?.key).toBe('joao');
  expect(artistKey('  João - Topic ')).toBe('joao');
  expect(tasteProfile(entries, [], ['b'], now).seed).toBeNull();
});
it('keeps discovery ordered and removes seed, duplicates, hidden and unavailable tracks', () => {
  const entries = [{ track: track('heard'), count: 1, score: 1, playedAt: now }];
  expect(
    recommendedTracks(
      [
        track('heard'),
        track('fresh'),
        track('fresh'),
        track('seed'),
        track('hidden'),
        { ...track('bad'), unavailable: 'missing' },
      ],
      entries,
      ['hidden'],
      'seed',
    ).map((t) => t.videoId),
  ).toEqual(['fresh', 'heard']);
});
it('ranks familiar artists without dropping the rest of the feed or repeating cards', () => {
  const item = (id: string, artist: string) => ({
    kind: 'song' as const,
    id,
    title: id,
    subtitle: '',
    artists: [{ name: artist, id: null }],
    album: null,
    thumbnail: null,
    wide: false,
    durationSec: 120,
    explicit: false,
  });
  const shelf = (title: string, id: string, artist: string): Shelf => ({
    title,
    layout: 'tracks',
    strapline: null,
    seeAll: null,
    items: [item(id, artist)],
  });
  const ranked = personalizedShelves(
    [
      shelf('Other', 'x', 'Other'),
      shelf('You', 'a', 'Maria'),
      shelf('Dupe', 'a', 'Maria'),
      shelf('Hidden', 'b', 'Maria'),
    ],
    [{ key: 'maria', score: 4 }],
    ['b'],
  );
  expect(ranked.map((s) => s.title)).toEqual(['You', 'Other']);
});
it('uses a stable daily seed from the strongest eligible tracks', () => {
  const entries = Array.from({ length: 6 }, (_, i) => ({
    track: track(String(i)),
    count: 6 - i,
    score: 6 - i,
    playedAt: now,
  }));
  expect(tasteProfile(entries, [], [], now).seed?.videoId).toBe(
    tasteProfile(entries, [], [], now + 1000).seed?.videoId,
  );
  expect(['0', '1', '2', '3']).toContain(tasteProfile(entries, [], [], now).seed?.videoId);
});

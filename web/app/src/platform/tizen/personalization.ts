import type { Shelf, Track } from '@/data/music/types';
import { listeningScore, type Entry } from './recentlyPlayed';

export const artistKey = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s*-\s*topic$/i, '')
    .trim()
    .toLowerCase();

/** Only intentional favorites and qualified listens influence taste; merely opening a song does not. */
export function tasteProfile(entries: Entry[], favorites: Track[], hidden: string[], now = Date.now()) {
  const blocked = new Set(hidden);
  const scores = new Map<string, { name: string; score: number }>();
  const weighted = entries
    .filter((e) => e.count > 0 && !blocked.has(e.track.videoId))
    .map((e) => ({ track: e.track, weight: listeningScore(e, now) }));
  for (const track of favorites) if (!blocked.has(track.videoId)) weighted.push({ track, weight: 5 });
  for (const { track, weight } of weighted)
    for (const artist of track.artists) {
      const key = artistKey(artist.name);
      if (!key || key === 'unknown' || key === 'artista desconhecido') continue;
      const previous = scores.get(key);
      scores.set(key, {
        name: artist.name.replace(/\s*-\s*Topic$/i, ''),
        score: (previous?.score ?? 0) + weight / Math.max(1, track.artists.length),
      });
    }
  const artists = [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 5)
    .map(([key, value]) => ({ key, ...value }));
  const seeds = weighted.sort((a, b) => b.weight - a.weight).map((e) => e.track);
  const unique = [...new Map(seeds.map((t) => [t.videoId, t])).values()];
  // Rotate among the strongest seeds once per day; the page stays stable while focus moves.
  const pool = unique.slice(0, 4);
  return { artists, seed: pool.length ? pool[Math.floor(now / 86400_000) % pool.length]! : null };
}

export function recommendedTracks(candidates: Track[], entries: Entry[], hidden: string[], seedId?: string): Track[] {
  const blocked = new Set(hidden);
  if (seedId) blocked.add(seedId);
  const heard = new Set(entries.filter((e) => e.count > 0).map((e) => e.track.videoId));
  const seen = new Set<string>();
  const tracks = candidates.filter(
    (t) => !t.unavailable && !blocked.has(t.videoId) && !seen.has(t.videoId) && !!seen.add(t.videoId),
  );
  // Discovery first, familiar tracks after; retain the provider's ordering inside each group.
  return [...tracks.filter((t) => !heard.has(t.videoId)), ...tracks.filter((t) => heard.has(t.videoId))].slice(0, 12);
}

export function personalizedShelves(
  shelves: Shelf[],
  artists: { key: string; score: number }[],
  hidden: string[],
): Shelf[] {
  const blocked = new Set(hidden);
  const seen = new Set<string>();
  const score = (s: Shelf) =>
    s.items.reduce(
      (total, item) =>
        total +
        item.artists.reduce((sum, a) => sum + (artists.find((x) => x.key === artistKey(a.name))?.score ?? 0), 0),
      0,
    );
  return shelves
    .map((s) => ({
      ...s,
      items: s.items
        .filter((item) => !blocked.has(item.id) && !seen.has(item.id) && !!seen.add(item.id))
        .slice(0, s.layout === 'tracks' ? 6 : 12),
    }))
    .filter(
      (s) =>
        s.items.length > 0 &&
        !['recently played', 'ouvidas recentemente', 'quick picks'].includes(s.title.toLowerCase()),
    )
    .map((shelf, index) => ({ shelf, index, score: score(shelf) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((x) => x.shelf);
}

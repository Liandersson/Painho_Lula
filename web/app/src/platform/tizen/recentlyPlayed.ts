import { create } from 'zustand';
import type { Track } from '@/data/music/types';

export const RECENT_STORAGE_KEY = 'painho:tv:recently-played:v1';
const LIMIT = 200;
const HALF_LIFE = 14 * 86400_000;
export interface Entry { track: Track; playedAt: number; count: number; score: number; lastStartedAt?: number }
export const listeningScore = (entry: Entry, now = Date.now()) => entry.score * 2 ** (-Math.max(0, now - entry.playedAt) / HALF_LIFE);
export function mostPlayed(entries: Entry[], now = Date.now()): Entry[] {
  return entries.filter(e => e.count >= 3).sort((a, b) => Number(b.count >= 5) - Number(a.count >= 5) || listeningScore(b, now) - listeningScore(a, now) || b.count - a.count || b.playedAt - a.playedAt);
}
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
interface RecentState { entries: Entry[]; record: (track: Track) => void; touch: (track: Track) => void }

function cleanTrack(value: unknown): Track | null {
  if (!value || typeof value !== 'object') return null;
  const t = value as Partial<Track>;
  if (typeof t.videoId !== 'string' || !t.videoId || typeof t.title !== 'string' || !Array.isArray(t.artists)) return null;
  return {
    videoId: t.videoId, title: t.title || t.videoId,
    artists: t.artists.filter(a => a && typeof a.name === 'string').map(a => ({ name: a.name, id: typeof a.id === 'string' ? a.id : null })),
    album: t.album && typeof t.album.name === 'string' ? { name: t.album.name, id: typeof t.album.id === 'string' ? t.album.id : null } : null,
    durationSec: typeof t.durationSec === 'number' && Number.isFinite(t.durationSec) ? t.durationSec : null,
    thumbnail: typeof t.thumbnail === 'string' && /^https?:\/\//.test(t.thumbnail) ? t.thumbnail : null,
    explicit: t.explicit === true, index: null, plays: null,
  };
}

export function createRecentStore(storage: StorageLike | null) {
  let entries: Entry[] = [];
  try {
    const saved: unknown = JSON.parse(storage?.getItem(RECENT_STORAGE_KEY) ?? '[]');
    if (Array.isArray(saved)) {
      const seen = new Set<string>();
      for (const entry of saved.slice(0,1000)) {
        const track = cleanTrack(entry?.track);
        if (!track || seen.has(track.videoId) || !Number.isFinite(entry?.playedAt)) continue;
        seen.add(track.videoId);
        const count = Number.isSafeInteger(entry.count) && entry.count > 0 ? entry.count : 0;
        const score = typeof entry.score === 'number' && Number.isFinite(entry.score) && entry.score >= 0 ? Math.min(entry.score, count) : count;
        entries.push({ track, playedAt: Math.min(Date.now(), entry.playedAt), count, score, lastStartedAt: Number.isFinite(entry.lastStartedAt) ? entry.lastStartedAt : entry.playedAt });

      }
      entries.sort((a,b)=>(b.lastStartedAt ?? b.playedAt)-(a.lastStartedAt ?? a.playedAt));
      entries=entries.slice(0,LIMIT);
      if(saved.length>LIMIT) storage?.setItem(RECENT_STORAGE_KEY,JSON.stringify(entries));
    }
  } catch { /* A damaged/unavailable local store must not stop playback. */ }
  return create<RecentState>()((set) => ({
    entries,
    touch: value => {
      const track = cleanTrack(value);
      if (!track || value.unavailable) return;
      set(state => {
        const previous = state.entries.find(e => e.track.videoId === track.videoId);
        const next = [{ track, playedAt: previous?.playedAt ?? 0, count: previous?.count ?? 0, score: previous?.score ?? 0, lastStartedAt: Date.now() }, ...state.entries.filter(e => e.track.videoId !== track.videoId)];
        next.sort((a,b) => (b.lastStartedAt ?? b.playedAt) - (a.lastStartedAt ?? a.playedAt));
        next.splice(LIMIT);
        try { storage?.setItem(RECENT_STORAGE_KEY, JSON.stringify(next)); } catch { /* Playback continues if storage is full. */ }
        return { entries: next };
      });
    },
    record: (value) => {
      const track = cleanTrack(value);
      if (!track || value.unavailable) return;
      set(state => {
        const now = Date.now();
        const previous = state.entries.find(e => e.track.videoId === track.videoId);
        const updated = { track, lastStartedAt: previous?.lastStartedAt ?? now, playedAt: now, count: (previous?.count ?? 0) + 1, score: (previous ? listeningScore(previous, now) : 0) + 1 };
        const next = [updated, ...state.entries.filter(e => e.track.videoId !== track.videoId)];
        next.sort((a,b) => (b.lastStartedAt ?? b.playedAt) - (a.lastStartedAt ?? a.playedAt));
        next.splice(LIMIT);
        try { storage?.setItem(RECENT_STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep the current-session list if storage is full. */ }
        return { entries: next };
      });
    },
  }));
}

let storage: StorageLike | null = null;
try { storage = localStorage; } catch { /* Storage can be disabled by the platform. */ }
export const useLocalRecentlyPlayed = createRecentStore(storage);

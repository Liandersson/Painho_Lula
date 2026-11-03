import { create } from 'zustand';
import type { Track } from '@/data/music/types';
import { cleanTrack } from './recentlyPlayed';

export const TV_PREFERENCES_KEY = 'lqmusic:tv:preferences:v1';
export const TOPICS = [
  { id: 'brasil', label: 'Brasil', query: 'música brasileira' },
  { id: 'relax', label: 'Relaxar', query: 'música relaxante acústica' },
  { id: 'energy', label: 'Energia', query: 'músicas animadas' },
  { id: 'focus', label: 'Foco', query: 'instrumental foco' },
  { id: 'forro', label: 'Forró', query: 'forró' },
  { id: 'sertanejo', label: 'Sertanejo', query: 'sertanejo' },
  { id: 'pop', label: 'Pop', query: 'pop music' },
  { id: 'rock', label: 'Rock', query: 'rock music' },
  { id: 'gospel', label: 'Gospel', query: 'gospel' },
  { id: 'samba', label: 'Samba e pagode', query: 'samba pagode' },
] as const;
export type AudioMode = 'quality' | 'compatible' | 'data';
interface Preferences {
  favorites: Track[];
  hidden: string[];
  topics: string[];
  audioMode: AudioMode;
  largeText: boolean;
  leveling: boolean;
  discovery: boolean;
}
interface Actions {
  toggleFavorite: (track: Track) => void;
  hide: (id: string) => void;
  restoreHidden: () => void;
  toggleTopic: (id: string) => void;
  setAudioMode: (mode: AudioMode) => void;
  setLeveling: (value: boolean) => void;
  setLargeText: (value: boolean) => void;
  setDiscovery: (value: boolean) => void;
}
const defaults: Preferences = {
  favorites: [],
  hidden: [],
  topics: ['brasil', 'relax', 'energy'],
  audioMode: 'quality',
  leveling: false,
  largeText: false,
  discovery: true,
};

export function createTvPreferences(storage: Pick<Storage, 'getItem' | 'setItem'> | null) {
  let initial = { ...defaults };
  try {
    const raw: unknown = JSON.parse(storage?.getItem(TV_PREFERENCES_KEY) ?? 'null');
    if (raw && typeof raw === 'object') {
      const value = raw as Partial<Preferences>;
      const tracks = Array.isArray(value.favorites)
        ? value.favorites
            .slice(0, 200)
            .map(cleanTrack)
            .filter((t): t is Track => !!t)
        : [];
      const favorites = [...new Map(tracks.map((t) => [t.videoId, t])).values()];
      const hidden = Array.isArray(value.hidden)
        ? [
            ...new Set(
              value.hidden.filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length < 256),
            ),
          ].slice(0, 500)
        : [];
      initial = {
        favorites: favorites.filter((t) => !hidden.includes(t.videoId)),
        hidden,
        topics: Array.isArray(value.topics)
          ? [...new Set(value.topics.filter((id) => TOPICS.some((t) => t.id === id)))].slice(0, TOPICS.length)
          : defaults.topics,
        audioMode: ['quality', 'compatible', 'data'].includes(value.audioMode ?? '') ? value.audioMode! : 'quality',
        leveling: value.leveling === true,
        largeText: value.largeText === true,
        discovery: value.discovery !== false,
      };
    }
  } catch {
    /* A damaged preference file never prevents playback. */
  }
  return create<Preferences & Actions>()((set, get) => {
    const update = (patch: Partial<Preferences>) => {
      set(patch);
      const { favorites, hidden, topics, audioMode, leveling, largeText, discovery } = get();
      try {
        storage?.setItem(
          TV_PREFERENCES_KEY,
          JSON.stringify({ favorites, hidden, topics, audioMode, leveling, largeText, discovery }),
        );
      } catch {
        /* Keep current-session preferences if storage is unavailable. */
      }
    };
    return {
      ...initial,
      toggleFavorite: (value) => {
        const track = cleanTrack(value);
        if (!track || value.unavailable) return;
        const state = get();
        update({
          favorites: state.favorites.some((t) => t.videoId === track.videoId)
            ? state.favorites.filter((t) => t.videoId !== track.videoId)
            : [track, ...state.favorites].slice(0, 200),
          hidden: state.hidden.filter((id) => id !== track.videoId),
        });
      },
      hide: (id) => {
        if (!id) return;
        update({
          hidden: [id, ...get().hidden.filter((x) => x !== id)].slice(0, 500),
          favorites: get().favorites.filter((t) => t.videoId !== id),
        });
      },
      restoreHidden: () => update({ hidden: [] }),
      toggleTopic: (id) => {
        if (!TOPICS.some((t) => t.id === id)) return;
        update({ topics: get().topics.includes(id) ? get().topics.filter((x) => x !== id) : [...get().topics, id] });
      },
      setAudioMode: (audioMode) => {
        if (['quality', 'compatible', 'data'].includes(audioMode)) update({ audioMode });
      },
      setLeveling: (leveling) => update({ leveling }),
      setLargeText: (largeText) => update({ largeText }),
      setDiscovery: (discovery) => update({ discovery }),
    };
  });
}
let storage: Storage | null = null;
try {
  storage = localStorage;
} catch {
  /* Restricted device storage. */
}
export const useTvPreferences = createTvPreferences(storage);

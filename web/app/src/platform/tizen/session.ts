import type { Track } from '@/data/music/types';
import { cleanTrack } from './recentlyPlayed';
import { getAudio, usePlayer } from '@/state/player';

export const TV_SESSION_KEY = 'lqmusic:tv:session:v1';
export interface SavedSession {
  tracks: Track[];
  seconds: number;
  savedAt: number;
}
export function readSavedSession(storage: Pick<Storage, 'getItem'> | null, now = Date.now()): SavedSession | null {
  try {
    const value = JSON.parse(storage?.getItem(TV_SESSION_KEY) ?? 'null');
    if (
      !value ||
      !Array.isArray(value.tracks) ||
      !Number.isFinite(value.seconds) ||
      !Number.isFinite(value.savedAt) ||
      now - value.savedAt > 30 * 86400_000 ||
      value.savedAt > now + 60_000
    )
      return null;
    const tracks = value.tracks
      .slice(0, 30)
      .map(cleanTrack)
      .filter((t: Track | null): t is Track => !!t);
    if (!tracks.length) return null;
    const duration = tracks[0]!.durationSec;
    return {
      tracks,
      seconds: Math.max(0, Math.min(value.seconds, duration && duration > 0 ? Math.max(0, duration - 1) : 86400)),
      savedAt: value.savedAt,
    };
  } catch {
    return null;
  }
}
export function sessionStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

/** Keep a small resumable queue, without rerendering React on the media clock. */
export function startSessionPersistence(storage: Pick<Storage, 'setItem'> | null = sessionStorage()) {
  let last = '';
  const save = () => {
    const state = usePlayer.getState(),
      audio = getAudio();
    if (!state.nowPlaying || !['playing', 'paused'].includes(state.status) || !audio || audio.seeking) return;
    const seconds = Math.floor(audio.currentTime);
    if (!Number.isFinite(seconds)) return;
    const tracks = state.queue
      .slice(state.index, state.index + 30)
      .map((e) => cleanTrack(e.track))
      .filter((t): t is Track => !!t);
    if (!tracks.length || tracks[0]!.videoId !== state.nowPlaying.videoId) return;
    if (Number.isFinite(audio.duration) && audio.duration > 0)
      tracks[0] = { ...tracks[0]!, durationSec: audio.duration };
    const signature = `${seconds}:${tracks.map((t) => t.videoId).join(',')}`;
    if (signature === last) return;
    try {
      storage?.setItem(TV_SESSION_KEY, JSON.stringify({ tracks, seconds, savedAt: Date.now() }));
      last = signature;
    } catch {
      /* Full storage must never interrupt audio. */
    }
  };
  const onVisibility = () => {
    if (document.hidden) save();
  };
  const timer = setInterval(save, 10_000);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', save);
  return () => {
    save();
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', save);
  };
}

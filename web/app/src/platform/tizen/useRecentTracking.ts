import { useEffect } from 'react';
import { getAudio, onTrackEnded, usePlayer } from '@/state/player';
import { isTizenBuild } from './services';
import { useLocalRecentlyPlayed } from './recentlyPlayed';

/** One lightweight sample per second; media jumps never become listening time. */
export function startRecentTracking() {
  let id: string | null = null, heard = 0, counted = false, touched = false;
  let previousAudio: HTMLAudioElement | null = null, lastPosition = 0, lastTime = performance.now();
  let wasPlaying = false, previousStatus = usePlayer.getState().status;
  const sample = () => {
    const state = usePlayer.getState(), playing = state.nowPlaying, audio = getAudio(), now = performance.now();
    const restarted = state.status === 'loading' && previousStatus !== 'loading';
    previousStatus = state.status;
    if (playing?.videoId !== id || restarted) {
      id = playing?.videoId ?? null; heard = 0; counted = false; touched = false; wasPlaying = false;
    }
    const position = audio?.currentTime ?? 0, wall = Math.max(0, (now - lastTime) / 1000);
    const running = state.status === 'playing' && !!audio && !audio.paused && !audio.seeking;
    const delta = position - lastPosition, rate = audio?.playbackRate || 1;
    if (running && wasPlaying && audio === previousAudio && delta >= 0 && delta <= wall * rate + 0.5 && wall <= 3) heard += Math.min(wall, delta / rate);
    lastTime = now; lastPosition = position; previousAudio = audio; wasPlaying = running;
    const duration = playing?.durationSec || audio?.duration || 0;
    const threshold = Number.isFinite(duration) && duration > 0 ? Math.min(60, duration / 2) : 60;
    if (!running || !playing) return;
    const queued = state.queue[state.index]?.track;
    const track = {
      videoId: playing.videoId, title: playing.title,
      artists: queued?.videoId === playing.videoId && queued.artists.length ? queued.artists : [{ name: playing.artist, id: null }],
      album: queued?.videoId === playing.videoId ? queued.album : null,
      thumbnail: playing.artworkUrl, durationSec: duration || null,
      explicit: queued?.videoId === playing.videoId && queued.explicit === true, index: null, plays: null,
    };
    if (!touched) { useLocalRecentlyPlayed.getState().touch(track); touched = true; }
    if (!counted && heard >= threshold) { useLocalRecentlyPlayed.getState().record(track); counted = true; }
  };
  sample();
  const unsubscribe = usePlayer.subscribe(sample);
  const unsubscribeEnded = onTrackEnded(() => { sample(); heard = 0; counted = false; touched = false; wasPlaying = false; });
  const timer = setInterval(sample, 1000);
  return () => { clearInterval(timer); unsubscribe(); unsubscribeEnded(); };
}
export function useRecentTracking() {
  useEffect(() => { if (isTizenBuild) return startRecentTracking(); }, []);
}

import type { Track } from '@/data/music/types';
import { artistLine, artistSet, extendStation, normalisedTitle, type Candidate } from './builder';

// Keep only identifiers for session history, and a small metadata-only buffer.
// At the limit, stop recommending rather than evicting history and repeating it.
export class ContinuationSession {
  seed: Track | null = null;
  generation = 0;
  private ids = new Set<string>();
  private recordings = new Set<string>();
  private pool: Candidate[] = [];
  private preferVideo = false;
  private retryAt = 0;
  canFetch(now = Date.now()) { return now >= this.retryAt; }
  deferFetch(now = Date.now()) { this.retryAt = now + 60_000; }
  private recordingKeys(track: Track) {
    const title = normalisedTitle(track.title);
    return [...artistSet(artistLine(track))].map(artist => `${title}\0${artist}`);
  }
  start(track: Track) { this.seed = track; this.pool = []; this.generation++; this.retryAt = 0; }
  remember(track: Track) {
    if (this.ids.size >= 10000) return;
    this.ids.add(track.videoId);
    this.recordingKeys(track).forEach(key => this.recordings.add(key));
  }
  get full() { return this.ids.size >= 10000; }
  private seen(track: Track) {
    return this.ids.has(track.videoId) || this.recordingKeys(track).some(key => this.recordings.has(key));
  }
  offer(candidates: Candidate[], preferVideo = false) { this.pool = candidates.slice(0, 60); this.preferVideo = preferVideo; this.deferFetch(); }
  take(existing: Track[], count: number, hidden: readonly string[] = []) {
    if (!this.seed || this.full) return [];
    // Preserve the provider's relevance order and catalogue/video preference.
    const blocked = new Set(hidden);
    return extendStation(existing, this.pool.filter(c => !c.track.unavailable && !blocked.has(c.track.videoId) && !this.seen(c.track)), count, this.preferVideo);
  }
}

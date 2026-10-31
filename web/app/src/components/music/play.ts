import type { ArtistRef, MusicItem, Track } from '@/data/music/types';
import type { QueueSource } from '@/playback/queue/timeline';
import { usePlayer } from '@/state/player';
import { isTizenBuild } from '@/platform/tizen/services';

/** A shelf or search item as a queue track. */
export function toTrack(item: Track | MusicItem, fallbackArtwork?: string | null): Track {
  if ('videoId' in item) return item.thumbnail || !fallbackArtwork ? item : { ...item, thumbnail: fallbackArtwork };
  return {
    videoId: item.id,
    title: item.title,
    artists: item.artists,
    album: item.album,
    durationSec: item.durationSec,
    explicit: item.explicit,
    thumbnail: item.thumbnail ?? fallbackArtwork ?? null,
    index: null,
    plays: null,
  };
}

/** One song on its own (Search, Home, a shelf): the queue is that song, then AutoPlay. */
export function playTrack(item: Track | MusicItem, fallbackArtwork?: string | null, source?: QueueSource) {
  const track = toTrack(item, fallbackArtwork);
  usePlayer.getState().playTrack(track, source ?? { title: track.title, type: 'other' });
}

export interface ListContext {
  source: QueueSource;
  /** Album artwork, for tracks that have none of their own. */
  fallbackArtwork?: string | null | undefined;
  /** The album's artists, for tracks credited to nobody. */
  fallbackArtists?: ArtistRef[] | undefined;
}

function prepared(tracks: Track[], { fallbackArtwork, fallbackArtists }: ListContext): Track[] {
  return tracks.map((t) => {
    const withArt = toTrack(t, fallbackArtwork);
    return withArt.artists.length || !fallbackArtists ? withArt : { ...withArt, artists: fallbackArtists };
  });
}

/** An album, playlist or list of songs, from [startIndex]: the list becomes the queue's context. */
export function playList(tracks: Track[], startIndex: number, context: ListContext) {
  if (!tracks.length) return;
  if (isTizenBuild) {
    const selected = tracks[Math.min(Math.max(startIndex, 0), tracks.length - 1)];
    if (!selected || selected.unavailable) return;
    // A list is a selection surface on TV, never an implicit playback queue.
    const [track] = prepared([selected], context);
    if (track) usePlayer.getState().playTrack(track, context.source);
    return;
  }
  usePlayer.getState().playTracks(prepared(tracks, context), startIndex, context.source);
}

/** The header's Shuffle: shuffle on, and the list from a random track. */
export function shuffleList(tracks: Track[], context: ListContext) {
  if (!tracks.length) return;
  const player = usePlayer.getState();
  if (!player.shuffle) player.toggleShuffle();
  playList(tracks, Math.floor(Math.random() * tracks.length), context);
}

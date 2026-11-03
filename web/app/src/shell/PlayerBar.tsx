import { useState } from 'react';
import {
  BackwardIcon,
  ForwardIcon,
  LyricsActiveIcon,
  LyricsIcon,
  PauseIcon,
  PlayIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  UpNextIcon,
} from '@/components/icons/Transport';
import { FavoriteButton } from '@/components/music/FavoriteButton';
import { TrackMenu } from '@/components/music/TrackMenu';
import { usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';
import { Lcd } from './Lcd';
import { fadeForVolume, VolumeControl } from './VolumeControl';
import { isTizenBuild } from '@/platform/tizen/services';

const control = 'grid place-items-center rounded-[6px] disabled:opacity-40';
// Shuffle and repeat: secondary, and the key colour when on, as Apple's toggles.
const toggle = `${control} size-7 text-secondary aria-pressed:text-key`;
const transport = `${control} size-7 text-primary`;
const action = 'grid h-7 w-6 place-items-center rounded-[4px] text-primary aria-pressed:text-key';
// The actions the volume level slides in over: they fade out while it's open.
const fading = `${action} ${fadeForVolume}`;

/** The floating glass player pill (report §1). */
export function PlayerBar() {
  const sidePanel = useUi((s) => s.sidePanel);
  const toggleSidePanel = useUi((s) => s.toggleSidePanel);
  const hasTrack = usePlayer((s) => s.nowPlaying !== null);
  const videoId = usePlayer((s) => s.nowPlaying?.videoId ?? null);
  // The queue's entry for what's playing: the track menu needs the full track.
  const track = usePlayer((s) => {
    const entry = s.queue[s.index]?.track;
    return entry && entry.videoId === s.nowPlaying?.videoId ? entry : null;
  });
  const playing = usePlayer((s) => s.status === 'playing' || s.status === 'buffering');
  const hasNext = usePlayer((s) => s.index + 1 < s.queue.length || s.repeat !== 'off' || (s.autoplay && s.index >= 0));
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const { togglePlay, next, previous, toggleShuffle, cycleRepeat } = usePlayer.getState();
  const [volumeOpen, setVolumeOpen] = useState(false);

  return (
    // The side panel overlays the page; the pill re-centres in what's left.
    <div
      className="pointer-events-none absolute right-0 bottom-(--player-bottom-offset) left-(--web-navigation-width) z-[calc(var(--z-web-chrome)-1)] flex justify-center px-5 transition-[padding-inline-end] duration-(--duration-panel) ease-panel data-[panel-open=true]:pe-[calc(var(--side-panel-width)+20px)] max-sm:hidden"
      data-panel-open={sidePanel !== null}
    >
      <div
        data-tv-mini-player
        className="glass-pill group/pill pointer-events-auto relative grid h-(--player-pill-height) w-[min(668px,100%)] grid-cols-[184px_minmax(180px,427px)_minmax(57px,auto)] items-center rounded-pill px-4"
        role="region"
        aria-label="Player"
      >
        <div className="flex items-center justify-between pr-2">
          <button data-tv-player-order="0" className={toggle} aria-label={isTizenBuild ? 'Aleatório' : 'Shuffle'} aria-pressed={shuffle} onClick={toggleShuffle}>
            <ShuffleIcon size={28} />
          </button>
          <div className="flex items-center gap-1.5">
            <button data-tv-player-order="1" className={transport} disabled={!hasTrack} aria-label={isTizenBuild ? 'Anterior' : 'Previous'} onClick={previous}>
              <BackwardIcon size={26} />
            </button>
            <button className={transport} data-tv-player-toggle data-tv-player-order="2" disabled={!hasTrack} aria-label={isTizenBuild ? (playing ? 'Pausar' : 'Tocar') : (playing ? 'Pause' : 'Play')} onClick={togglePlay}>
              {playing ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
            </button>
            <button data-tv-player-order="3" className={transport} disabled={!hasTrack || !hasNext} aria-label={isTizenBuild ? 'Próxima' : 'Next'} onClick={next}>
              <ForwardIcon size={26} />
            </button>
          </div>
          <button
            data-tv-player-order="4" className={toggle}
            aria-label={isTizenBuild ? (repeat === 'one' ? 'Repetir uma' : repeat === 'all' ? 'Repetir todas' : 'Repetir') : (repeat === 'one' ? 'Repeat one' : repeat === 'all' ? 'Repeat all' : 'Repeat')}
            aria-pressed={repeat !== 'off'}
            onClick={cycleRepeat}
          >
            {repeat === 'one' ? <RepeatOneIcon size={28} /> : <RepeatIcon size={28} />}
          </button>
        </div>

        <div className="h-full min-w-0 px-4">
          <Lcd />
        </div>

        <div
          className="group/actions relative flex items-center justify-end gap-[9px]"
          data-volume-open={volumeOpen || undefined}
          onPointerLeave={() => setVolumeOpen(false)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setVolumeOpen(false);
          }}
        >
          {!isTizenBuild && <FavoriteButton videoId={videoId} className={fading} />}
          {track && <span data-tv-player-order="6"><TrackMenu track={track} className={fading} placement="above-end" onFullScreen={isTizenBuild ? () => useUi.getState().setFullScreen(true) : undefined} /></span>}
          {/* Always here: the panel itself says whether this track has lyrics, and from where. */}
          <button data-tv-player-order="7" className={fading} aria-label={isTizenBuild ? 'Letras' : 'Lyrics'} aria-pressed={sidePanel === 'lyrics'} onClick={() => toggleSidePanel('lyrics')}>
            {sidePanel === 'lyrics' ? <LyricsActiveIcon size={18} /> : <LyricsIcon size={18} />}
          </button>
          <button
            data-tv-player-order="8" className={fading}
            aria-label={isTizenBuild ? 'Fila' : 'Up Next'}
            aria-pressed={sidePanel === 'up-next'}
            onClick={() => toggleSidePanel('up-next')}
          >
            <UpNextIcon size={18} />
          </button>
          <span data-tv-player-order="9"><VolumeControl open={volumeOpen} onOpen={() => setVolumeOpen(true)} className={action} /></span>
        </div>
      </div>
    </div>
  );
}

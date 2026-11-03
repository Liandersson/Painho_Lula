import TvHome from '@/platform/tizen/TvHome';
import { useEffect, useRef } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Shelves, TrackShelf } from '@/components/music/ShelfView';
import { LoadError, LoadMoreError, NeedsExtension } from '@/components/music/States';
import { useHome, useLibrary, useYouTubeReady } from '@/data/music/queries';
import type { Track } from '@/data/music/types';
import { HomeSkeleton } from '@/skeletons/PageSkeletons';
import { ShelfSkeleton } from '@/skeletons/ShelfSkeleton';
import { useLocalRecentlyPlayed, mostPlayed } from '@/platform/tizen/recentlyPlayed';
import { isTizenBuild } from '@/platform/tizen/services';

const RECENT_TITLE = isTizenBuild ? 'Ouvidas recentemente' : 'Recently Played';
const RECENT_LIMIT = isTizenBuild ? 6 : 20;
const RECENT_SOURCE = { title: RECENT_TITLE, type: 'home' as const };

/**
 * The account's listening history, newest first, one row per song
 * (YtMusicRepository.recentlyPlayed): the first 20, signed in only. The same
 * query as Library's Recently Played, so either page warms the other.
 */
function useRecentlyPlayed(): Track[] {
  const history = useLibrary('recent');
  const local = useLocalRecentlyPlayed(s => s.entries);
  if (isTizenBuild) return [...local].sort((a,b) => (b.lastStartedAt ?? b.playedAt) - (a.lastStartedAt ?? a.playedAt)).map(entry => entry.track);
  const first = history.data?.pages[0]?.data.tracks ?? [];
  const seen = new Set<string>();
  return first.filter((t) => !seen.has(t.videoId) && seen.add(t.videoId)).slice(0, RECENT_LIMIT);
}

/** YouTube Music's home feed, as Apple's Home: shelf after shelf, more as you scroll. */
function StandardHomePage() {
  const { missing } = useYouTubeReady();
  const home = useHome();
  const ranked = useRecentlyPlayed();
  const recent = ranked.slice(0, RECENT_LIMIT);
  const sentinel = useRef<HTMLDivElement>(null);
  const recentShelf = recent.length > 0 ? <TrackShelf title={RECENT_TITLE} to={isTizenBuild ? undefined : '/library/recent'} tracks={recent} source={RECENT_SOURCE} /> : isTizenBuild ? <p className="tv-history-empty">As músicas aparecerão aqui assim que a reprodução começar.</p> : null;
  const favourites = useLocalRecentlyPlayed(s => s.entries);
  const picks = isTizenBuild && mostPlayed(favourites).length ? <TrackShelf title="Quick picks" tracks={mostPlayed(favourites).slice(0, 6).map(e => e.track)} source={{title:'Quick picks', type:'home'}} /> : null;

  // Loads the next shelves before the bottom comes into view; after a failed
  // page it waits for Try Again rather than retrying on every scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !home.hasNextPage || home.isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !home.isFetchingNextPage) void home.fetchNextPage();
      },
      { root: document.getElementById('scrollable-page'), rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [home.hasNextPage, home.isFetchingNextPage, home.isFetchNextPageError, home.fetchNextPage]);

  if (missing) {
    return (
      <div data-tv-home>
        <PageHeader title="Home" />
        <NeedsExtension />
      </div>
    );
  }
  // Only a failed first page replaces the feed; a later one is shown under it.
  if (home.isError && !home.data) {
    return (
      <div data-tv-home>
        <PageHeader title="Home" />
        {recentShelf}
        {picks}
        <LoadError error={home.error} onRetry={() => void home.refetch()} />
      </div>
    );
  }
  if (!home.data) return <div data-tv-home>{recentShelf}{picks}<HomeSkeleton /></div>;

  // YouTube's feed can carry its own, older Recently Played; the history wins, as on the phone.
  const shelves = home.data.pages
    .flatMap((page) => page.data)
    .map(shelf => isTizenBuild ? { ...shelf, items: shelf.items.filter(item => !['song', 'video'].includes(item.kind)) } : shelf)
    .filter(shelf => shelf.items.length > 0)
    .filter((shelf) => isTizenBuild
      ? shelf.layout !== 'tracks' && !['recently played', 'ouvidas recentemente', 'quick picks', 'escolhas rápidas', 'suas mais ouvidas'].includes(shelf.title.trim().toLowerCase())
      : !(recent.length > 0 && ['recently played', 'ouvidas recentemente'].includes(shelf.title.trim().toLowerCase())));
  return (
    <div data-tv-home>
      <PageHeader title="Home" />
      {recentShelf}
      {picks}
      <Shelves shelves={shelves} />
      <div ref={sentinel} />
      {home.isFetchingNextPage && <ShelfSkeleton kind="square" />}
      {home.isFetchNextPageError && <LoadMoreError onRetry={() => void home.fetchNextPage()} />}
    </div>
  );
}

export default function HomePage() { return isTizenBuild ? <TvHome /> : <StandardHomePage />; }

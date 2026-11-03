import { isTizenBuild } from '@/platform/tizen/services';
import { useTvPreferences } from '@/platform/tizen/preferences';
import { usePlayer } from '@/state/player';
import { StarFilledIcon, StarIcon } from '@/components/icons/Transport';
import { useLikeStatus, useSetLiked, useSignedIn } from '@/data/music/queries';

interface FavoriteButtonProps {
  videoId: string | null;
  className?: string;
  size?: number;
}

/**
 * Apple's Favorite star, backed by YouTube Music's like (a liked song joins
 * Liked Music). Only shown signed in; the state is read from the track's
 * watch page, as YouTube's own player reads it.
 */
function AccountFavoriteButton({ videoId, className, size = 18 }: FavoriteButtonProps) {
  const signedIn = useSignedIn();
  const status = useLikeStatus(videoId);
  const setLiked = useSetLiked();
  if (!signedIn || !videoId) return null;
  const liked = status.data === 'LIKE';
  return (
    <button
      className={className}
      aria-label={liked ? 'Unfavorite' : 'Favorite'}
      aria-pressed={liked}
      disabled={status.isPending}
      onClick={(event) => {
        event.stopPropagation();
        setLiked.mutate({ videoId, liked: !liked });
      }}
    >
      {liked ? <StarFilledIcon size={size} /> : <StarIcon size={size} />}
    </button>
  );
}

function LocalFavoriteButton({ videoId, className, size = 18 }: FavoriteButtonProps) {
  const track = usePlayer(s => s.queue.find(e => e.track.videoId === videoId)?.track);
  const liked = useTvPreferences(s => s.favorites.some(t => t.videoId === videoId));
  if (!videoId || !track) return null;
  return <button className={className} aria-label={liked ? 'Remover das favoritas' : 'Adicionar às favoritas'} aria-pressed={liked} onClick={event => { event.stopPropagation(); useTvPreferences.getState().toggleFavorite(track); }}>{liked ? <StarFilledIcon size={size}/> : <StarIcon size={size}/>}</button>;
}
export function FavoriteButton(props: FavoriteButtonProps) { return isTizenBuild ? <LocalFavoriteButton {...props}/> : <AccountFavoriteButton {...props}/>; }

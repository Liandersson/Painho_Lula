import { Heart, Play } from 'lucide-react';
import { Link } from 'react-router';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { TrackLockup } from '@/components/music/Lockups';
import { trackItem } from '@/components/music/ShelfView';
import { usePlayer } from '@/state/player';
import { useTvPreferences } from './preferences';

export default function TvFavorites() {
  const favorites = useTvPreferences((s) => s.favorites);
  const [visible, setVisible] = useState(20);
  return (
    <div data-tv-recents data-tv-favorites>
      <PageHeader title="Suas favoritas" />
      <p className="tv-home-note">
        Sua coleção pessoal, salva nesta TV. Use o menu ⋯ de qualquer música para adicionar ou remover.
      </p>
      {favorites.length ? (
        <>
          <button
            className="tv-primary-action tv-favorites-play"
            onClick={() => usePlayer.getState().playTracks(favorites, 0, { title: 'Favoritas', type: 'home' })}
          >
            <Play size={22} fill="currentColor" />
            Tocar favoritas
          </button>
          <ul className="tv-recents-list">
            {favorites.slice(0, visible).map((track) => (
              <li key={track.videoId}>
                <TrackLockup item={trackItem(track)} />
              </li>
            ))}
          </ul>
          {visible < favorites.length && (
            <button className="tv-load-more" data-tv-load-more onClick={() => setVisible((n) => n + 20)}>
              Mostrar mais favoritas
            </button>
          )}
        </>
      ) : (
        <div className="tv-empty-favorites">
          <Heart size={60} />
          <h2>Guarde o que você gosta.</h2>
          <p>Favorite uma música no menu ⋯. Ela aparecerá aqui e ajudará a personalizar sua Home.</p>
          <Link className="tv-primary-action" to="/search">
            Encontrar músicas
          </Link>
        </div>
      )}
    </div>
  );
}

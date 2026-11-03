import { readSavedSession, sessionStorage } from './session';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Heart, Play, Search, Sparkles, RefreshCw, SlidersHorizontal, Music2 } from 'lucide-react';
import { Artwork } from '@/components/music/Artwork';
import { TrackShelf, Shelves } from '@/components/music/ShelfView';
import { LoadError } from '@/components/music/States';
import { toTrack } from '@/components/music/play';
import { useHome, useYouTubeReady } from '@/data/music/queries';
import { fetchRadio, fetchSearch } from '@/data/music/api';
import { usePlayer } from '@/state/player';
import { useLocalRecentlyPlayed } from './recentlyPlayed';
import { useTvPreferences, TOPICS } from './preferences';
import { personalizedShelves, recommendedTracks, tasteProfile } from './personalization';

export default function TvHome() {
  const { ready } = useYouTubeReady();
  const entries = useLocalRecentlyPlayed((s) => s.entries);
  const favorites = useTvPreferences((s) => s.favorites);
  const hidden = useTvPreferences((s) => s.hidden);
  const topics = useTvPreferences((s) => s.topics);
  const discovery = useTvPreferences((s) => s.discovery);
  const home = useHome(discovery);
  const [topic, setTopic] = useState('you');
  const [saved] = useState(() => readSavedSession(sessionStorage()));
  const hasTrack = usePlayer((s) => s.nowPlaying !== null);
  const [visible, setVisible] = useState(5);
  const [day] = useState(() => Date.now());
  const taste = useMemo(() => tasteProfile(entries, favorites, hidden, day), [entries, favorites, hidden, day]);
  const selected = TOPICS.find((t) => t.id === topic);
  const artist = taste.artists.find((a) => `artist:${a.key}` === topic);
  const search = selected?.query ?? artist?.name ?? '';
  useEffect(() => {
    if (topic !== 'you' && (!discovery || (!selected && !artist))) setTopic('you');
  }, [topic, selected, artist, discovery]);
  const radio = useQuery({
    queryKey: ['tv', 'for-you', taste.seed?.videoId ?? ''],
    queryFn: () => fetchRadio(taste.seed!.videoId),
    enabled: ready && !!taste.seed && topic === 'you' && discovery,
    staleTime: 30 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const results = useQuery({
    queryKey: ['tv', 'topic', search],
    queryFn: () => fetchSearch(search),
    enabled: ready && !!search && discovery,
    staleTime: 30 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
  const recent = useMemo(
    () =>
      entries
        .filter((e) => !hidden.includes(e.track.videoId))
        .slice(0, 6)
        .map((e) => e.track),
    [entries, hidden],
  );
  const recommendations = useMemo(
    () =>
      recommendedTracks(
        search
          ? [...(results.data?.songs ?? []), ...(results.data?.top.filter((i) => i.kind === 'song') ?? [])].map((i) =>
              toTrack(i),
            )
          : (radio.data?.candidates.map((c) => c.track) ?? []),
        entries,
        hidden,
        search ? undefined : taste.seed?.videoId,
      ),
    [search, results.data, radio.data, entries, hidden, taste.seed?.videoId],
  );
  const shelves = useMemo(
    () => personalizedShelves(home.data?.pages.flatMap((p) => p.data) ?? [], taste.artists, hidden),
    [home.data, taste.artists, hidden],
  );
  const mix = [
    ...new Map(
      (search ? recommendations : [...(taste.seed ? [taste.seed] : []), ...recommendations, ...favorites, ...recent])
        .filter((t) => !hidden.includes(t.videoId))
        .map((t) => [t.videoId, t]),
    ).values(),
  ].slice(0, 30);
  const mixSource = {
    title: search ? (selected?.label ?? artist?.name ?? 'Sua seleção') : 'Seu mix',
    type: 'home' as const,
  };
  const featured = search ? recommendations[0] : (taste.seed ?? favorites[0] ?? recent[0]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const title =
    topic === 'you'
      ? taste.seed
        ? 'Uma seleção com a sua cara.'
        : 'Sua próxima música favorita.'
      : (selected?.label ?? artist?.name ?? 'Para você');
  const recommendationTitle = search
    ? `Para ouvir: ${selected?.label ?? artist?.name}`
    : taste.seed
      ? `Porque você ouviu ${taste.seed.artists[0]?.name ?? taste.seed.title}`
      : 'Descubra seu próximo som';
  const loading = search ? results.isFetching : radio.isFetching;
  const error = search ? results.isError : radio.isError;
  const changeTopic = (id: string) => {
    setTopic(id);
    setVisible(5);
  };

  return (
    <div data-tv-home data-tv-home-v2>
      <header className="tv-home-heading">
        <div>
          <p className="tv-eyebrow">{greeting} · LqMusic</p>
          <h1>Para você</h1>
        </div>
        <div className="tv-header-actions">
          <Link to="/search" className="tv-icon-action" aria-label="Buscar músicas">
            <Search size={25} />
          </Link>
          <Link to="/favorites" className="tv-icon-action" aria-label="Abrir favoritas">
            <Heart size={25} />
          </Link>
          <Link to="/settings" className="tv-icon-action" aria-label="Personalizar o aplicativo">
            <SlidersHorizontal size={25} />
          </Link>
        </div>
      </header>
      <nav className="tv-topic-bar" aria-label="Seu momento">
        <button className="tv-topic" aria-pressed={topic === 'you'} onClick={() => changeTopic('you')}>
          <Sparkles size={19} />
          Para você
        </button>
        {discovery &&
          taste.artists.slice(0, 2).map((a) => (
            <button
              key={a.key}
              className="tv-topic"
              aria-pressed={topic === `artist:${a.key}`}
              onClick={() => changeTopic(`artist:${a.key}`)}
            >
              {a.name}
            </button>
          ))}
        {discovery &&
          TOPICS.filter((t) => topics.includes(t.id)).map((t) => (
            <button key={t.id} className="tv-topic" aria-pressed={topic === t.id} onClick={() => changeTopic(t.id)}>
              {t.label}
            </button>
          ))}
      </nav>
      <section className="tv-home-hero" aria-label="Seu mix pessoal">
        <div className="tv-hero-copy">
          <span className="tv-eyebrow">
            <Sparkles size={18} /> FEITO PARA O SEU MOMENTO
          </span>
          <h2>{title}</h2>
          <p>
            {taste.seed
              ? 'Seus favoritos e o que você escuta dão o tom. Descubra novos sons, sem perder o que você gosta.'
              : 'Escolha um tema, encontre uma música e deixe a Home acompanhar seu gosto. Tudo começa com o primeiro play.'}
          </p>
          <div className="tv-hero-actions">
            {mix.length ? (
              <button
                className="tv-primary-action"
                data-tv-default-focus
                onClick={() => usePlayer.getState().playTracks(mix, 0, mixSource)}
              >
                <Play size={22} fill="currentColor" />
                {search ? 'Tocar seleção' : 'Tocar meu mix'}
              </button>
            ) : (
              <Link
                to={search ? `/search?q=${encodeURIComponent(search)}` : '/search'}
                className="tv-primary-action"
                data-tv-default-focus
              >
                <Search size={22} />
                Encontrar uma música
              </Link>
            )}
            <Link to="/favorites" className="tv-secondary-action">
              <Heart size={21} />
              {favorites.length ? `${favorites.length} favoritas` : 'Minhas favoritas'}
            </Link>
          </div>
        </div>
        <div className="tv-hero-art" aria-hidden="true">
          {featured?.thumbnail ? (
            <Artwork src={featured.thumbnail} displayWidth={280} eager radius="22px" />
          ) : (
            <div className="tv-hero-placeholder">
              <Music2 size={88} />
            </div>
          )}
          {featured && <span>{featured.artists[0]?.name ?? featured.title}</span>}
        </div>
      </section>
      {!hasTrack && saved && !hidden.includes(saved.tracks[0]!.videoId) && (
        <button
          className="tv-resume"
          onClick={() =>
            usePlayer.getState().playTracks(
              saved.tracks.filter((t) => !hidden.includes(t.videoId)),
              0,
              { title: 'Continuar sessão', type: 'home' },
              saved.seconds,
            )
          }
        >
          <Play size={21} />
          <span>
            <strong>Continuar de onde parou</strong>
            <span>
              {saved.tracks[0]!.title} · {Math.floor(saved.seconds / 60)}:
              {String(Math.floor(saved.seconds % 60)).padStart(2, '0')}
            </span>
          </span>
        </button>
      )}
      <p className="tv-input-hint">
        Setas para navegar · OK para escolher · Voltar para retornar · Cursor e clique também funcionam
      </p>
      {favorites.length > 0 && (
        <TrackShelf
          title="Suas favoritas"
          to="/favorites"
          tracks={favorites.filter((t) => !hidden.includes(t.videoId)).slice(0, 6)}
          source={{ title: 'Favoritas', type: 'home' }}
        />
      )}
      {recent.length > 0 && (
        <TrackShelf
          title="Ouvidas recentemente"
          to="/recents"
          tracks={recent}
          source={{ title: 'Recentes', type: 'home' }}
        />
      )}
      {discovery && (
        <section className="tv-recommendations" aria-label="Recomendações pessoais" aria-busy={loading}>
          {recommendations.length > 0 && (
            <TrackShelf
              title={recommendationTitle}
              tracks={recommendations.slice(0, 6)}
              source={{ title: recommendationTitle, type: 'home' }}
            />
          )}
          {loading && !recommendations.length && (
            <p className="tv-home-note" role="status">
              Preparando músicas para você…
            </p>
          )}
          {error && (
            <div className="tv-home-note">
              Não foi possível buscar novas recomendações agora. Suas músicas continuam disponíveis.
              <button
                className="tv-secondary-action"
                onClick={() => void (search ? results.refetch() : radio.refetch())}
              >
                <RefreshCw size={18} />
                Tentar novamente
              </button>
            </div>
          )}
          {search && results.data && !recommendations.length && !loading && (
            <p className="tv-home-note">Nenhuma música encontrada neste tema. Experimente outro.</p>
          )}
        </section>
      )}
      {home.isError && !home.data && <LoadError error={home.error} onRetry={() => void home.refetch()} />}
      {discovery && topic === 'you' && (
        <>
          {shelves.length > 0 && (
            <div className="tv-discovery-label">
              <span className="tv-eyebrow">EXPLORE MAIS</span>
              <p>
                {taste.artists.length
                  ? 'Artistas e coleções em sintonia com o que você ouve.'
                  : 'Artistas, coleções e novidades para descobrir seu gosto.'}
              </p>
            </div>
          )}
          <Shelves shelves={shelves.slice(0, visible)} />
          {home.isPending && (
            <p className="tv-home-note" role="status">
              Carregando novidades…
            </p>
          )}
          {visible < 30 && (visible < shelves.length || home.hasNextPage) && (
            <button
              className="tv-load-more"
              disabled={home.isFetchingNextPage}
              onClick={() => {
                if (visible >= shelves.length) void home.fetchNextPage();
                setVisible((n) => Math.min(n + 5, 30));
              }}
            >
              <RefreshCw size={20} />
              {home.isFetchingNextPage ? 'Buscando…' : 'Explorar mais músicas'}
            </button>
          )}
          {home.isFetchNextPageError && (
            <p className="tv-home-note" role="status">
              A conexão falhou. Use “Explorar mais músicas” para tentar novamente.
            </p>
          )}
        </>
      )}
      <footer className="tv-home-footer">
        Seu gosto fica nesta TV. Favorite músicas no menu ⋯ para melhorar suas recomendações.
        <Link to="/settings">Ajustar meus temas</Link>
      </footer>
    </div>
  );
}

/** Local visual QA only. Vite removes this dynamic import from production builds. */
import { queryClient } from '@/lib/queryClient';
import { useTvPreferences, TOPICS } from './preferences';
import { useLocalRecentlyPlayed } from './recentlyPlayed';
import type { Track, MusicItem, Shelf } from '@/data/music/types';

const names = [
  'Noite de verão',
  'Caminhos de casa',
  'Amanhecer',
  'Entre estrelas',
  'Deixa o som levar',
  'Perto do mar',
  'Novo horizonte',
  'Som de domingo',
];
const artists = [
  'Maré Azul',
  'Clara Luz',
  'Trio Horizonte',
  'Maré Azul',
  'Clara Luz',
  'Trio Horizonte',
  'Maré Azul',
  'Clara Luz',
];
const palettes = [
  ['#326b75', '#c5977f'],
  ['#6f4a97', '#d9979e'],
  ['#456b5a', '#c1a76b'],
  ['#334580', '#bc8ed4'],
  ['#964e68', '#dbab75'],
  ['#36767a', '#84c6ae'],
];
function cover(i: number) {
  const [a, b] = palettes[i % palettes.length]!;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><defs><linearGradient id="a" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="400" fill="url(#a)"/><circle cx="290" cy="90" r="75" fill="#ffffff25"/><path d="M0 280 Q180 120 400 320 V400 H0" fill="#10131d45"/><text x="30" y="335" font-family="sans-serif" font-size="28" fill="white">${names[i % names.length]}</text><text x="30" y="370" font-family="sans-serif" font-size="17" fill="#ffffffe0">LQMUSIC · PRÉVIA</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
export function prepareTvPreview() {
  const tracks: Track[] = names.map((title, i) => ({
    videoId: `preview-${i}`,
    title,
    artists: [{ name: artists[i]!, id: null }],
    album: { name: 'Horizontes', id: null },
    durationSec: 180 + i * 12,
    explicit: false,
    thumbnail: cover(i),
    index: null,
    plays: null,
  }));
  const item = (track: Track): MusicItem => ({
    kind: 'song',
    id: track.videoId,
    title: track.title,
    artists: track.artists,
    album: track.album,
    subtitle: track.artists[0]!.name,
    thumbnail: track.thumbnail,
    wide: false,
    durationSec: track.durationSec,
    explicit: false,
  });
  const shelves: Shelf[] = [
    {
      title: 'Novos caminhos para ouvir',
      layout: 'square',
      strapline: null,
      seeAll: null,
      items: tracks.slice(0, 6).map((t, i) => ({ ...item(t), id: `album-${i}`, kind: 'album' as const })),
    },
    {
      title: 'O som que combina com você',
      layout: 'tracks',
      strapline: null,
      seeAll: null,
      items: tracks.slice(2).map(item),
    },
  ];
  useLocalRecentlyPlayed.setState({
    entries: tracks
      .slice(0, 4)
      .map((track, i) => ({
        track,
        count: 5 - i,
        score: 5 - i,
        playedAt: Date.now() - i * 50000,
        lastStartedAt: Date.now() - i * 50000,
      })),
  });
  useTvPreferences.setState({
    favorites: tracks.slice(0, 3),
    hidden: [],
    topics: ['brasil', 'relax', 'forro'],
    discovery: true,
  });
  queryClient.setQueryData(['music', 'home'], { pages: [{ data: shelves, next: null }], pageParams: [null] });
  for (const track of tracks)
    queryClient.setQueryData(['tv', 'for-you', track.videoId], {
      candidates: tracks.slice(2).map((track) => ({ track, isVideo: false })),
      seedIsVideo: false,
    });
  for (const query of [...TOPICS.map((t) => t.query), ...artists])
    queryClient.setQueryData(['tv', 'topic', query], {
      songs: tracks.slice(2).map(item),
      top: [],
      artists: [],
      albums: [],
      playlists: [],
      videos: [],
    });
}

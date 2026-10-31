// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { Track } from '@/data/music/types';
import { createRecentStore, RECENT_STORAGE_KEY, mostPlayed } from './recentlyPlayed';

const track = (videoId: string): Track => ({ videoId, title: `Song ${videoId}`, artists: [{ name: 'Artist', id: null }], album: null, durationSec: 120, explicit: false, thumbnail: 'https://example.com/art.jpg', index: null, plays: null });
function memoryStorage() {
  const data = new Map<string,string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key,value); } };
}

describe('local TV listening history', () => {
  it('persists qualified counts and favours repeated recent plays without inventing legacy counts', () => {
    const storage=memoryStorage();
    storage.setItem(RECENT_STORAGE_KEY,JSON.stringify([{track:track('legacy'),playedAt:Date.now()}]));
    const store=createRecentStore(storage);
    expect(store.getState().entries[0]!.count).toBe(0);expect(mostPlayed(store.getState().entries)).toEqual([]);
    for(let i=0;i<3;i++)store.getState().record(track('A'));
    for(let i=0;i<5;i++)store.getState().record(track('B'));
    expect(mostPlayed(store.getState().entries).map(e=>e.track.videoId)).toEqual(['B','A']);
    expect(createRecentStore(storage).getState().entries.find(e=>e.track.videoId==='B')?.count).toBe(5);
  });
  it('ranks recent listens above stale listens in the same frequency tier',()=>{
    const now=Date.now();
    const entries=[{track:track('old'),playedAt:now-28*86400000,count:4,score:4},{track:track('new'),playedAt:now,count:3,score:3}];
    expect(mostPlayed(entries,now).map(e=>e.track.videoId)).toEqual(['new','old']);
  });

  it('keeps the latest listen first without duplicates and survives recreating the store', () => {
    const storage = memoryStorage(), store = createRecentStore(storage);
    store.getState().record(track('A')); store.getState().record(track('B')); store.getState().record(track('A'));
    expect(store.getState().entries.map(e => e.track.videoId)).toEqual(['A','B']);
    expect(createRecentStore(storage).getState().entries.map(e => e.track.videoId)).toEqual(['A','B']);
  });
  it('bounds history to 200 entries and keeps only valid metadata', () => {
    const store = createRecentStore(memoryStorage());
    for (let i=0;i<205;i++) store.getState().record(track(String(i)));
    expect(store.getState().entries).toHaveLength(200);
    expect(store.getState().entries[0]!.track.videoId).toBe('204');
    expect(store.getState().entries.at(-1)!.track.videoId).toBe('5');
    store.getState().record({ ...track('bad'), unavailable: 'missing' });
    expect(store.getState().entries[0]!.track.videoId).toBe('204');
  });
  it('recovers from damaged storage and does not stop playback when writing fails', () => {
    const storage = memoryStorage(); storage.setItem(RECENT_STORAGE_KEY,'not-json');
    expect(createRecentStore(storage).getState().entries).toEqual([]);
    const store = createRecentStore({ getItem: () => null, setItem: () => { throw new Error('quota'); } });
    expect(() => store.getState().record(track('A'))).not.toThrow();
    expect(store.getState().entries[0]!.track.videoId).toBe('A');
  });
});

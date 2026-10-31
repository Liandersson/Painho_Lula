import { describe, expect, it } from 'vitest';
import type { Track } from '@/data/music/types';
import { ContinuationSession } from './continuation';
const track = (videoId: string, title=videoId): Track => ({videoId,title,artists:[{name:'Artist',id:null}],album:null,thumbnail:null,durationSec:180,explicit:false,index:null,plays:null});
describe('anchored continuation', () => {
 it('limits empty or failing recommendation refreshes and resets cooldown on a new seed', () => {
  const session=new ContinuationSession();session.start(track('a'));
  expect(session.canFetch(100)).toBe(true);session.deferFetch(100);
  expect(session.canFetch(60_099)).toBe(false);expect(session.canFetch(60_100)).toBe(true);
  session.start(track('b'));expect(session.canFetch(101)).toBe(true);
 });

 it('keeps the initial seed, filters played recordings across manual queue replacements, and buffers only metadata', () => {
  const session=new ContinuationSession(); const seed=track('a'); session.start(seed); session.remember(seed);
  session.offer([{track:seed,isVideo:false},{track:track('b'),isVideo:false},{track:track('c'),isVideo:false}]);
  const selected=session.take([],1); expect(selected.map(t=>t.videoId)).toEqual(['b']); session.remember(selected[0]!);
  expect(session.seed).toBe(seed); expect(session.take([],3).map(t=>t.videoId)).toEqual(['c']);
  session.start(track('new')); session.offer([{track:track('b-other','b'),isVideo:false},{track:track('d'),isVideo:false}]);
  expect(session.take([],3).map(t=>t.videoId)).toEqual(['d']);
 });
 it('caps candidate storage, avoids queued songs, and preserves video preference', () => {
  const session=new ContinuationSession(); session.start(track('seed'));
  session.offer(Array.from({length:100},(_,i)=>({track:{...track(String(i)),artists:[{name:String(i),id:null}]},isVideo:true})),true);
  expect(session.take([],100)).toHaveLength(60);
  expect(session.take([track('0')],1)[0]?.videoId).toBe('1');
 });
});

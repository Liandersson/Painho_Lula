// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayer } from '@/state/player';
import { useLocalRecentlyPlayed } from './recentlyPlayed';
import { startRecentTracking } from './useRecentTracking';
const mocks=vi.hoisted(()=>({audio:null as HTMLAudioElement|null, ended:null as (()=>void)|null}));
vi.mock('@/state/player', async () => {
 const {create}=await import('zustand');return {getAudio:()=>mocks.audio,onTrackEnded:(fn:()=>void)=>{mocks.ended=fn;return ()=>{mocks.ended=null;};},usePlayer:create(()=>({status:'idle',nowPlaying:null,queue:[],index:-1}))};
});
vi.mock('./services',()=>({isTizenBuild:true}));
const playing=(videoId:string)=>({videoId,title:videoId,artist:'Artist',artworkUrl:null,durationSec:120,streamInfo:null,stream:null});
let stop:(()=>void)|undefined;
beforeEach(()=>{
 vi.useFakeTimers();
 const audio=document.createElement('audio');Object.defineProperty(audio,'paused',{get:()=>usePlayer.getState().status!=='playing'});
 mocks.audio=audio;
 // Fake timer callbacks use the same monotonic clock as the sample interval.
 vi.spyOn(performance,'now').mockImplementation(()=>Date.now());
 usePlayer.setState({status:'idle',nowPlaying:null,queue:[],index:-1});useLocalRecentlyPlayed.setState({entries:[]});
});
afterEach(()=>{stop?.();vi.useRealTimers();vi.restoreAllMocks();});
function listen(seconds:number){for(let i=0;i<seconds;i++){mocks.audio!.currentTime+=1;vi.advanceTimersByTime(1000);}}
function start(id:string){usePlayer.setState({status:'loading',nowPlaying:playing(id)});mocks.audio!.currentTime=0;usePlayer.setState({status:'playing'});}
describe('qualified listening',()=>{
 it('ignores quick skips, loading, errors, pauses and seeks; counts once after half of a 120s track',()=>{
  stop=startRecentTracking();start('skip');listen(10);start('A');listen(20);
  mocks.audio!.currentTime=100;vi.advanceTimersByTime(1000);
  usePlayer.setState({status:'paused'});vi.advanceTimersByTime(90000);usePlayer.setState({status:'playing'});listen(39);
  expect(useLocalRecentlyPlayed.getState().entries.filter(e=>e.count>0)).toEqual([]);listen(1);
  expect(useLocalRecentlyPlayed.getState().entries[0]?.count).toBe(1);
  usePlayer.setState({status:'paused'});usePlayer.setState({status:'playing'});listen(10);
  expect(useLocalRecentlyPlayed.getState().entries[0]?.count).toBe(1);
 });
 it('counts a genuine replay of the same song, including a new load with the same id',()=>{
  stop=startRecentTracking();start('A');listen(60);start('A');listen(60);
  expect(useLocalRecentlyPlayed.getState().entries[0]?.count).toBe(2);
 });
 it('counts repeat-one playback after the engine ends the prior run',()=>{
  stop=startRecentTracking();start('A');listen(60);mocks.ended?.();mocks.audio!.currentTime=0;vi.advanceTimersByTime(1000);listen(60);
  expect(useLocalRecentlyPlayed.getState().entries[0]?.count).toBe(2);
 });
 it('does not count buffering and releases its only timer on cleanup',()=>{
  stop=startRecentTracking();start('A');listen(10);usePlayer.setState({status:'buffering'});listen(100);
  expect(useLocalRecentlyPlayed.getState().entries.filter(e=>e.count>0)).toEqual([]);stop();stop=undefined;expect(vi.getTimerCount()).toBe(0);
 });
});

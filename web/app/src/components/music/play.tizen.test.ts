import {beforeEach,describe,expect,it,vi} from 'vitest';
import type {Track} from '@/data/music/types';
import {playList,shuffleList} from './play';
const mocks=vi.hoisted(()=>({tv:true,playTrack:vi.fn(),playTracks:vi.fn(),toggleShuffle:vi.fn()}));
vi.mock('@/platform/tizen/services',()=>({get isTizenBuild(){return mocks.tv;}}));
vi.mock('@/state/player',()=>({usePlayer:{getState:()=>({...mocks,shuffle:false})}}));
const tracks:Track[]=['a','b','c'].map(videoId=>({videoId,title:videoId,artists:[],album:null,durationSec:100,explicit:false,thumbnail:null,index:null,plays:null}));
beforeEach(()=>{vi.clearAllMocks();mocks.tv=true;});
describe('TV list selection',()=>{
 for(const type of ['home','playlist','album','library','search'] as const) it(`plays only selected track from ${type} without importing the list`,()=>{
  const source={title:'List',type};playList(tracks,1,{source,fallbackArtwork:'https://example.com/art.jpg',fallbackArtists:[{name:'Artist',id:null}]});
  expect(mocks.playTracks).not.toHaveBeenCalled();
  expect(mocks.playTrack).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({videoId:'b',thumbnail:'https://example.com/art.jpg',artists:[{name:'Artist',id:null}]}),source);
 });
 it('does nothing for empty or unavailable selections',()=>{
  const context={source:{title:'Recentes',type:'home' as const}};
  playList([],0,context);playList([{...tracks[0]!,unavailable:'missing'}],0,context);
  expect(mocks.playTrack).not.toHaveBeenCalled();expect(mocks.playTracks).not.toHaveBeenCalled();
 });
 it('shuffle selects one track on TV',()=>{
  const random=vi.spyOn(Math,'random').mockReturnValue(0.5);
  shuffleList(tracks,{source:{title:'Playlist',type:'playlist'}});
  expect(mocks.playTrack).toHaveBeenCalledWith(tracks[1],expect.anything());expect(mocks.playTracks).not.toHaveBeenCalled();random.mockRestore();
 });
 it('preserves the full list on non-TV builds',()=>{
  mocks.tv=false;const source={title:'Album',type:'album' as const};playList(tracks,1,{source});
  expect(mocks.playTracks).toHaveBeenCalledExactlyOnceWith(tracks,1,source);expect(mocks.playTrack).not.toHaveBeenCalled();
 });
});

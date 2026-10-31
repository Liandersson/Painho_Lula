// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import HomePage from './HomePage';
import {useLocalRecentlyPlayed} from '@/platform/tizen/recentlyPlayed';
const mocks=vi.hoisted(()=>({shelves:[] as unknown[]}));
vi.mock('@/platform/tizen/services',()=>({isTizenBuild:true}));
vi.mock('@/components/PageHeader',()=>({PageHeader:()=> <h1>Home</h1>}));
vi.mock('@/data/music/queries',()=>({useYouTubeReady:()=>({missing:false}),useLibrary:()=>({}),useHome:()=>({hasNextPage:false,data:{pages:[{data:[{title:'Quick picks',layout:'tracks',items:[{id:'unheard',kind:'song'}]},{title:'Playlists',layout:'square',items:[{id:'playlist',kind:'playlist'},{id:'unheard',kind:'song'}]}]}]}})}));
vi.mock('@/components/music/ShelfView',()=>({TrackShelf:({title,tracks}:{title:string,tracks:{videoId:string}[]})=><section aria-label={title}>{tracks.map(t=><span key={t.videoId} data-track={t.videoId}/>)}</section>,Shelves:({shelves}:{shelves:unknown[]})=>{mocks.shelves=shelves;return null;}}));
let root:ReturnType<typeof createRoot>,container:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});container=document.createElement('div');document.body.append(container);root=createRoot(container);useLocalRecentlyPlayed.setState({entries:[]});});
afterEach(()=>{act(()=>root.unmount());container.remove();});
it('shows recent starts without requiring qualified frequency counts',()=>{
 act(()=>root.render(<HomePage/>));expect(container.textContent).toContain('assim que a reprodução começar');expect(container.querySelectorAll('[data-track]')).toHaveLength(0);
 expect(mocks.shelves).toEqual([expect.objectContaining({title:'Playlists',items:[{id:'playlist',kind:'playlist'}]})]);
});
it('shows latest starts in Recentes while Quick picks still uses qualified favourites',()=>{
 const entries=Array.from({length:13},(_,i)=>({track:{videoId:String(i),title:String(i),artists:[],album:null,durationSec:120,explicit:false,thumbnail:null,index:null,plays:null},playedAt:Date.now(),lastStartedAt:Date.now()+i,count:i===12?2:5,score:20-i}));
 useLocalRecentlyPlayed.setState({entries});act(()=>root.render(<HomePage/>));
 const sections=container.querySelectorAll('section');expect(sections).toHaveLength(2);expect(sections[0]!.querySelectorAll('[data-track]')).toHaveLength(6);expect(sections[1]!.querySelectorAll('[data-track]')).toHaveLength(6);
 const ids=[...container.querySelectorAll('[data-track]')].map(el=>el.getAttribute('data-track'));expect(new Set(ids).size).toBe(12);expect(ids).toContain('12');expect(sections[1]!.querySelector('[data-track="12"]')).toBeNull();
});

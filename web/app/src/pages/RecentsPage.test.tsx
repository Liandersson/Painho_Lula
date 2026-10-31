// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import RecentsPage from './RecentsPage';
import {useLocalRecentlyPlayed} from '@/platform/tizen/recentlyPlayed';
const mocks=vi.hoisted(()=>({play:vi.fn(),navigation:"PUSH"}));
vi.mock('react-router',()=>({useNavigationType:()=> mocks.navigation}));
vi.mock('@/components/PageHeader',()=>({PageHeader:({title}:{title:string})=><h1>{title}</h1>}));
vi.mock('@/components/music/Lockups',()=>({TrackLockup:({item,onPlay}:{item:{id:string,title:string},onPlay:()=>void})=><div data-tv-card data-tv-card-key={item.id}><button data-tv-primary onClick={onPlay}>{item.title}</button></div>}));
vi.mock('@/components/music/ShelfView',()=>({trackItem:(t:{videoId:string})=>({...t,id:t.videoId})}));
vi.mock('@/components/music/play',()=>({playTrack:mocks.play}));
let root:ReturnType<typeof createRoot>,node:HTMLElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});vi.stubGlobal('IntersectionObserver',class{observe(){}disconnect(){}});vi.spyOn(HTMLElement.prototype,'scrollIntoView').mockImplementation(()=>{});node=document.createElement('main');node.id='scrollable-page';document.body.append(node);root=createRoot(node);useLocalRecentlyPlayed.setState({entries:[]});mocks.play.mockClear();mocks.navigation="PUSH";});
afterEach(()=>{act(()=>root.unmount());node.remove();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('shows a simple empty history',()=>{act(()=>root.render(<RecentsPage/>));expect(node.textContent).toContain('Você ainda não ouviu nenhuma música.');});
it('loads 20 at a time in descending recent order and selects only one track',()=>{
 const entries=Array.from({length:200},(_,i)=>({track:{videoId:String(i),title:`Song ${i}`,artists:[],album:null,durationSec:120,thumbnail:null,explicit:false,index:null,plays:null},playedAt:i,lastStartedAt:i,count:0,score:0}));
 useLocalRecentlyPlayed.setState({entries});act(()=>root.render(<RecentsPage/>));let buttons=node.querySelectorAll('[data-tv-primary]');expect(buttons).toHaveLength(20);expect(buttons[0]!.textContent).toBe('Song 199');
 act(()=>(buttons[5] as HTMLButtonElement).click());expect(mocks.play).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({videoId:'194'}),undefined,{title:'Recents',type:'home'});
 act(()=>node.querySelector<HTMLButtonElement>('[data-tv-load-more]')!.click());buttons=node.querySelectorAll('[data-tv-primary]');expect(buttons).toHaveLength(40);expect(document.activeElement).toBe(buttons[20]);
});

it('restores the focused recording when returning to Recents',async()=>{
 const entries=Array.from({length:40},(_,i)=>({track:{videoId:'restore'+i,title:'Restore '+i,artists:[],album:null,durationSec:120,thumbnail:null,explicit:false,index:null,plays:null},playedAt:i,lastStartedAt:i,count:0,score:0}));
 useLocalRecentlyPlayed.setState({entries});act(()=>root.render(<RecentsPage/>));const target=node.querySelectorAll<HTMLElement>('[data-tv-primary]')[7]!;act(()=>target.focus());const id=target.closest('[data-tv-card-key]')!.getAttribute('data-tv-card-key');node.scrollTop=650;node.dispatchEvent(new Event('scroll'));
 act(()=>root.render(null));mocks.navigation='POP';act(()=>root.render(<RecentsPage/>));await act(async()=>{await new Promise(resolve=>setTimeout(resolve,35));});
 expect(document.activeElement?.closest('[data-tv-card-key]')?.getAttribute('data-tv-card-key')).toBe(id);expect(node.scrollTop).toBe(650);
});

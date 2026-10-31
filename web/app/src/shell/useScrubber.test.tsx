// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {useScrubber} from './useScrubber';
const mocks=vi.hoisted(()=>({audio:null as HTMLAudioElement|null, seek:vi.fn()}));
vi.mock('@/platform/tizen/services',()=>({isTizenBuild:true}));
vi.mock('@/state/player',()=>({getAudio:()=>mocks.audio,getPlayhead:()=>null,getMixBeat:()=>null,usePlayer:(select:(s:unknown)=>unknown)=>select({status:'paused',deck:0,mixing:false,seek:mocks.seek})}));
it('seeks backward and forward while paused and paints time and fill immediately, with limits',()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 const audio=document.createElement('audio'); Object.defineProperty(audio,'duration',{value:120}); audio.currentTime=60; mocks.audio=audio;
 mocks.seek.mockImplementation((seconds:number)=>{audio.currentTime=seconds;});
 function View(){const {bar,elapsed,remaining,handlers}=useScrubber();return <div {...handlers}><div ref={bar}/><span ref={elapsed}/><span ref={remaining}/></div>;}
 const container=document.createElement('div');document.body.append(container);const root=createRoot(container);
 act(()=>root.render(<View/>));const slider=container.querySelector<HTMLElement>('[role="slider"]')!;
 const key=(key:string)=>act(()=>{slider.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));});
 key('ArrowLeft');expect(audio.currentTime).toBe(55);expect(slider.textContent).toBe('0:55-1:05');expect(slider.firstElementChild?.getAttribute('style')).toContain('0.458');
 key('ArrowRight');expect(audio.currentTime).toBe(60);expect(slider.getAttribute('aria-valuenow')).toBe('60');
 key('Home');key('ArrowLeft');expect(audio.currentTime).toBe(0);key('End');key('ArrowRight');expect(audio.currentTime).toBe(120);
 act(()=>root.unmount());container.remove();mocks.audio=null;
});

it('TV compact progress adjusts only after OK, and leaves edit mode on blur',()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const audio=document.createElement('audio');Object.defineProperty(audio,'duration',{value:120});audio.currentTime=60;mocks.audio=audio;mocks.seek.mockImplementation((seconds:number)=>{audio.currentTime=seconds;});
 function View(){const {bar,handlers}=useScrubber();return <div data-tv-mini-player><div {...handlers}><div ref={bar}/></div><button>Next</button></div>;}
 const container=document.createElement('div');document.body.append(container);const root=createRoot(container);act(()=>root.render(<View/>));const slider=container.querySelector<HTMLElement>('[role="slider"]')!;
 const key=(key:string)=>act(()=>{slider.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));});
 key('ArrowRight');expect(audio.currentTime).toBe(60);key('Enter');expect(slider.hasAttribute('data-tv-seek-editing')).toBe(true);key('ArrowLeft');expect(audio.currentTime).toBe(55);key('Enter');expect(slider.hasAttribute('data-tv-seek-editing')).toBe(false);
 act(()=>slider.focus());key('Enter');act(()=>container.querySelector('button')!.focus());expect(slider.hasAttribute('data-tv-seek-editing')).toBe(false);
 act(()=>root.unmount());container.remove();mocks.audio=null;
});

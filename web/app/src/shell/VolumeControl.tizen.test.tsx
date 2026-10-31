// @vitest-environment happy-dom
import {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect,it,vi} from 'vitest';
import {VolumeControl} from './VolumeControl';
const mocks=vi.hoisted(()=>({mute:vi.fn(),volume:vi.fn()}));
vi.mock('@/platform/tizen/services',()=>({isTizenBuild:true}));
vi.mock('@/state/player',()=>({usePlayer:(select:(state:unknown)=>unknown)=>select({volume:0.7,muted:false,setVolume:mocks.volume,toggleMute:mocks.mute})}));
it('renders mute only, without a level slider, focus expansion or wheel volume changes',()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});const node=document.createElement('div');document.body.append(node);const root=createRoot(node),open=vi.fn();
 act(()=>root.render(<VolumeControl open onOpen={open} className=""/>));expect(node.querySelector('input')).toBeNull();const button=node.querySelector('button')!;expect(button.getAttribute('aria-label')).toBe('Silenciar');
 act(()=>button.focus());act(()=>button.dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true})));act(()=>button.click());
 expect(mocks.mute).toHaveBeenCalledTimes(1);expect(mocks.volume).not.toHaveBeenCalled();expect(open).not.toHaveBeenCalled();act(()=>root.unmount());node.remove();
});

// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchField } from './SearchField';
import { useTizenRemote } from '@/platform/tizen/useTizenRemote';

const mocks = vi.hoisted(() => ({ play: vi.fn(), navigate: vi.fn(), next: vi.fn(), previous: vi.fn(), toggle: vi.fn(), fullScreen: false, closeFullScreen: vi.fn() }));
vi.mock('@/platform/tizen/services', () => ({ isTizenBuild: true }));
vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate, useLocation: () => ({ pathname: '/search' }) }));
vi.mock('@/state/player', () => ({ usePlayer: { getState: () => ({ next: mocks.next, previous: mocks.previous, togglePlay: mocks.toggle, status: 'playing' }) } }));
vi.mock('@/state/ui', () => ({ useUi: { getState: () => ({ fullScreen: mocks.fullScreen, setFullScreen: mocks.closeFullScreen }) } }));
vi.mock('@/data/music/queries', () => ({ useSuggestions: () => ({ data: { queries: [], items: [{ id: 'test-song', kind: 'song', title: 'Test song', artists: [], thumbnail: null }] } }) }));
vi.mock('./play', () => ({ playTrack: mocks.play, toTrack: (item: unknown) => item }));
vi.mock('./Artwork', () => ({ Artwork: () => null }));
vi.mock('./TrackMenu', () => ({ TrackMenu: () => null }));
vi.mock('./links', () => ({ hrefFor: () => null }));

let root: Root;
beforeEach(() => {
  (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
  mocks.play.mockClear(); mocks.navigate.mockClear(); mocks.next.mockClear(); mocks.previous.mockClear(); mocks.toggle.mockClear(); mocks.closeFullScreen.mockClear(); mocks.fullScreen = false;
});
afterEach(() => { act(() => root.unmount()); document.body.innerHTML = ''; });

describe('search with the TV remote', () => {
  it('focus does not edit; OK opens editing and Done returns focus to the readonly bar', async()=>{
    const search=vi.fn();function Screen(){useTizenRemote();return <SearchField initial="Test" onSearch={search}/>;}
    act(()=>root.render(<Screen/>));const input=document.querySelector('input')!;act(()=>input.focus());expect(input.readOnly).toBe(true);
    act(()=>input.dispatchEvent(new KeyboardEvent('keydown',{keyCode:13,bubbles:true,cancelable:true})));expect(input.readOnly).toBe(false);expect(search).not.toHaveBeenCalled();
    act(()=>input.dispatchEvent(new KeyboardEvent('keydown',{keyCode:65376,bubbles:true,cancelable:true})));
    await act(async()=>{await new Promise(resolve=>setTimeout(resolve,35));});
    expect(input.readOnly).toBe(true);expect(document.activeElement).toBe(input);expect(search).toHaveBeenCalledExactlyOnceWith('Test');
  });

  it('Enter in the text field searches the typed query rather than playing a highlighted suggestion',()=>{
    const search=vi.fn();function Screen(){useTizenRemote();return <SearchField initial="Test" onSearch={search}/>;}
    act(()=>root.render(<Screen/>));const input=document.querySelector('input')!;act(()=>input.click());act(()=>input.focus());
    act(()=>input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:13,bubbles:true,cancelable:true})));
    expect(search).toHaveBeenCalledExactlyOnceWith('Test');expect(mocks.play).not.toHaveBeenCalled();expect(document.activeElement).not.toBe(input);
  });

  it('registers CH keys, skips tracks once per press, and consumes channel events', () => {
    const registerKey=vi.fn();
    Object.assign(globalThis,{tizen:{tvinputdevice:{registerKey}}});
    function Screen() { useTizenRemote(); return <button>Play</button>; }
    act(() => root.render(<Screen />));
    expect(registerKey).toHaveBeenCalledWith('ChannelUp');
    expect(registerKey).toHaveBeenCalledWith('ChannelDown');
    for (const [keyCode,repeat] of [[427,false],[427,true],[428,false]] as const) {
      const event=new KeyboardEvent('keydown',{keyCode,repeat,bubbles:true,cancelable:true});
      act(() => document.dispatchEvent(event)); expect(event.defaultPrevented).toBe(true);
    }
    expect(mocks.next).toHaveBeenCalledTimes(1); expect(mocks.previous).toHaveBeenCalledTimes(1);
    delete (globalThis as typeof globalThis & {tizen?:unknown}).tizen;
  });
  it('Back releases search text entry without navigating away', () => {
    function Screen() { useTizenRemote(); return <SearchField initial="Test" onSearch={vi.fn()} />; }
    act(() => root.render(<Screen />)); const input=document.querySelector('input')!;
    act(() => input.click());act(() => input.focus());
    act(() => input.dispatchEvent(new KeyboardEvent('keydown',{keyCode:10009,bubbles:true,cancelable:true})));
    expect(document.activeElement).not.toBe(input); expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('Up from the first suggestion returns to the search field', () => {
    function Screen() { useTizenRemote(); return <SearchField initial="Test" onSearch={vi.fn()} />; }
    act(() => root.render(<Screen />)); const input=document.querySelector('input')!;
    act(() => input.click());act(() => input.focus());
    act(() => input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true})));
    const option=document.querySelector<HTMLElement>('[role="option"]')!;
    act(() => option.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true,cancelable:true})));
    expect(document.activeElement).toBe(input);
  });

  it('reaches Next from Play with Right, activates it with OK, and closes fullscreen with Back', () => {
    mocks.fullScreen = true;
    function Player() { useTizenRemote(); return <div role="dialog" aria-modal="true" data-full-screen><div data-tv-transport-row><button onClick={mocks.previous}>Previous</button><button data-tv-default-focus>Play</button><button onClick={mocks.next}>Next</button></div></div>; }
    act(() => root.render(<Player />));
    const buttons = document.querySelectorAll('button');
    act(() => buttons[1]!.focus());
    act(() => { buttons[1]!.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 39, bubbles: true, cancelable: true })); });
    expect(document.activeElement).toBe(buttons[2]);
    act(() => { buttons[2]!.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true })); });
    act(() => { document.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 13, bubbles: true, cancelable: true })); });
    expect(mocks.next).toHaveBeenCalledTimes(1);
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 10009, bubbles: true, cancelable: true })); });
    expect(mocks.closeFullScreen).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('handles the physical fast-forward and rewind keys while fullscreen is open', () => {
    mocks.fullScreen = true;
    function Player() { useTizenRemote(); return <button>Play</button>; }
    act(() => root.render(<Player />));
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 417, bubbles: true, cancelable: true })); });
    act(() => { document.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 412, bubbles: true, cancelable: true })); });
    expect(mocks.next).toHaveBeenCalledTimes(1);
    expect(mocks.previous).toHaveBeenCalledTimes(1);
  });

  it('activates a settings checkbox with OK instead of treating it as text entry', () => {
    function Settings() { useTizenRemote(); return <input type="checkbox" aria-label="Setting" />; }
    act(() => root.render(<Settings />));
    const checkbox = document.querySelector('input')!;
    act(() => checkbox.focus());
    act(() => { checkbox.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13, bubbles: true, cancelable: true })); });
    act(() => { checkbox.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 13, bubbles: true, cancelable: true })); });
    expect(checkbox.checked).toBe(true);
  });

  it('consumes the remote OK key cycle and activates the focused song exactly once', () => {
    function Screen() { useTizenRemote(); return <SearchField initial="Test" onSearch={vi.fn()} />; }
    act(() => root.render(<Screen />));
    const input = document.querySelector('input')!;
    act(() => input.click());act(() => input.focus());
    act(() => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })); });
    const option = document.querySelector<HTMLElement>('[role="option"]')!;
    expect(document.activeElement).toBe(option);
    const down = new KeyboardEvent('keydown', { key: 'Unidentified', keyCode: 13, bubbles: true, cancelable: true });
    act(() => { option.dispatchEvent(down); });
    const up = new KeyboardEvent('keyup', { key: 'Unidentified', keyCode: 13, bubbles: true, cancelable: true });
    act(() => { document.dispatchEvent(up); });
    expect(down.defaultPrevented).toBe(true);
    expect(up.defaultPrevented).toBe(true);
    expect(mocks.play).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(input);
  });

  it('moves actual focus out of the input, then plays the suggestion with one OK press', () => {
    const search = vi.fn();
    act(() => root.render(<SearchField initial="Test" onSearch={search} />));
    const input = document.querySelector('input')!;
    act(() => input.click());act(() => input.focus());
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })));
    const option = document.querySelector<HTMLElement>('[role="option"]')!;
    expect(document.activeElement).toBe(option);
    expect(document.querySelector('[role="listbox"]')).not.toBeNull();
    act(() => option.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })));
    expect(mocks.play).toHaveBeenCalledTimes(1);
    expect(search).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(input);
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });

  it('submits the text and releases the input when the Samsung keyboard reports Done', () => {
    const search = vi.fn();
    act(() => root.render(<SearchField initial="Test" onSearch={search} />));
    const input = document.querySelector('input')!;
    act(() => input.click());act(() => input.focus());
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Unidentified', keyCode: 65376, bubbles: true, cancelable: true })));
    expect(search).toHaveBeenCalledExactlyOnceWith('Test');
    expect(document.activeElement).not.toBe(input);
    expect(mocks.play).not.toHaveBeenCalled();
  });
});

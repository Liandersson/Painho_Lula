import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePlayer } from '@/state/player';
import { useUi } from '@/state/ui';
import { isTizenBuild } from './services';
import { createSpatialNavigation, tvKey, type Direction } from './spatialNavigation';

interface TVApi {
  tvinputdevice?: { registerKey(name: string): void };
  application?: { getCurrentApplication(): { exit(): void } };
}

export function useTizenRemote() {
  const navigate = useNavigate();
  const location = useLocation();
  const consumedEnter = useRef(false);
  const pathname = useRef(location.pathname);
  pathname.current = location.pathname;
  useEffect(() => {
    if (!isTizenBuild) return;
    document.documentElement.classList.add('tizen-tv');
    const tv = (globalThis as typeof globalThis & { tizen?: TVApi }).tizen;
    const navigation = createSpatialNavigation();
    for (const key of ['MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop', 'MediaTrackNext', 'MediaTrackPrevious', 'MediaFastForward', 'MediaRewind', 'ChannelUp', 'ChannelDown']) {
      try { tv?.tvinputdevice?.registerKey(key); } catch { /* Key not supplied by this remote/firmware. */ }
    }
    const onKey = (event: KeyboardEvent) => {
      const code = event.keyCode;
      const key = tvKey(event);
      const target = document.activeElement as HTMLElement | null;
      const controlInput = target?.tagName === 'INPUT' && /^(checkbox|radio|button|submit|reset)$/.test((target as HTMLInputElement).type);
      const slider = target?.matches('input[type="range"]') || !!target?.closest('[role="slider"]');
      const editing = target?.isContentEditable || /^(TEXTAREA|SELECT)$/.test(target?.tagName ?? '') || (target?.tagName === 'INPUT' && !(target as HTMLInputElement).readOnly && !controlInput && !slider);
      const player = usePlayer.getState();
      if ([427, 428].includes(code) || ['ChannelUp', 'ChannelDown'].includes(key)) {
        // Holding CH must not launch a burst of asynchronous stream requests.
        if (!event.repeat) {
          if (code === 427 || key === 'ChannelUp') player.next(); else player.previous();
        }
      }
      else if (code === 10252 || event.key === 'MediaPlayPause') player.togglePlay();
      else if (code === 415 || event.key === 'MediaPlay') { if (player.status !== 'playing') player.togglePlay(); }
      else if ([19, 413].includes(code) || ['MediaPause', 'MediaStop'].includes(event.key)) { if (player.status === 'playing') player.togglePlay(); }
      else if (code === 10233 || event.key === 'MediaTrackNext') player.next();
      else if (code === 10232 || event.key === 'MediaTrackPrevious') player.previous();
      else if (useUi.getState().fullScreen && (code === 417 || key === 'MediaFastForward')) player.next();
      else if (useUi.getState().fullScreen && (code === 412 || key === 'MediaRewind')) player.previous();
      else if (key === 'Enter' && !editing && !slider) {
        event.preventDefault(); event.stopPropagation();
        consumedEnter.current = true;
        if (!event.repeat) target?.click();
        return;
      }
      else if (key === 'BrowserBack' || key === 'Escape') {
        if (slider && target?.hasAttribute('data-tv-seek-editing')) {
          target.removeAttribute('data-tv-seek-editing'); event.preventDefault(); event.stopPropagation(); return;
        }
        if (editing) {
          if(target?.matches('[data-tv-search-field] input')) target.dispatchEvent(new Event('tv-search-close'));
          else target?.blur();
          event.preventDefault(); event.stopPropagation();
          return;
        }
        const suggestion = target?.closest<HTMLElement>('[role="option"]');
        if (suggestion?.closest('[data-tv-search-field]')) {
          document.querySelector<HTMLElement>('[data-tv-search-results] button:not(:disabled),[data-tv-search-results] a[href]')?.focus({ preventScroll: true });
          if (document.activeElement === target) target?.blur();
          event.preventDefault(); event.stopPropagation();
          return;
        }
        if (target?.closest('[role="menu"],[role="dialog"]:not([data-full-screen])')) {
          if (key === 'BrowserBack') {
            event.preventDefault(); event.stopPropagation();
            target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          }
          return;
        }
        const ui = useUi.getState();
        if (ui.fullScreen) ui.setFullScreen(false);
        else if (ui.sidePanel) ui.closeSidePanel();
        else if (pathname.current !== '/home') {
          if ((window.history.state?.idx ?? 0) > 0) navigate(-1); else navigate('/home');
        } else if (window.confirm('Sair do LqMusic?')) tv?.application?.getCurrentApplication().exit();
      } else if (!editing && !target?.closest('[role="menu"]') && /^Arrow(Left|Right|Up|Down)$/.test(key)) {
        const option = target?.closest<HTMLElement>('[role="option"]');
        const list = option?.closest('[role="listbox"]');
        if (option && list && (key === 'ArrowUp' || key === 'ArrowDown')) {
          const options = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
          const index = options.indexOf(option);
          const next = options[index + (key === 'ArrowDown' ? 1 : -1)];
          if (next) { next.focus({ preventScroll: true }); next.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }
          else if (key === 'ArrowUp') option.closest('[data-tv-search-field]')?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
          event.preventDefault(); event.stopPropagation(); return;
        }
        const horizontal = key === 'ArrowLeft' || key === 'ArrowRight';
        if (slider && horizontal && (!target?.closest('[data-tv-mini-player]') || target.hasAttribute('data-tv-seek-editing'))) return;
        const transport = target?.closest('[data-tv-transport-row]');
        if (transport && horizontal) {
          const buttons = [...transport.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
          const index = buttons.indexOf(target as HTMLButtonElement);
          buttons[Math.max(0,Math.min(buttons.length - 1,index + (key === 'ArrowRight' ? 1 : -1)))]?.focus({ preventScroll: true });
        } else navigation.move(key.slice(5) as Direction);
      } else return;
      event.preventDefault();
      event.stopPropagation();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (tvKey(event) === 'Enter' && consumedEnter.current) {
        consumedEnter.current = false;
        event.preventDefault(); event.stopPropagation();
      }
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('keyup', onKeyUp, true);
    return () => {
      navigation.dispose();
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('keyup', onKeyUp, true);
    };
  }, [navigate]);
}

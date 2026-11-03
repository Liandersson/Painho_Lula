import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { isTizenBuild } from './services';

/** Each TV page opens from its own top, instead of inheriting another page's scroll. */
export function useTvRouteReset() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    if (!isTizenBuild) return;
    const page = document.getElementById('scrollable-page');
    if (page) page.scrollTop = 0;
  }, [pathname]);
}

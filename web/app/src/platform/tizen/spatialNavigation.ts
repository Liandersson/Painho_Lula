export type Direction = 'Left' | 'Right' | 'Up' | 'Down';
interface Candidate { element: HTMLElement; rect: DOMRect; horizontallyVisible: boolean }
const SELECTOR = 'button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function createSpatialNavigation(doc: Document = document) {
  let cached: Candidate[] | null = null;
  let measuredAt = 0;
  let cachedModal: HTMLElement | undefined;
  let focusedCard: HTMLElement | null = null;
  let rememberedCard: string | null = null;
  let playerReturn: HTMLElement | null = null;
  let lastScrollAt = 0;
  const cardKey = (element: HTMLElement) => {
    const card = element.closest<HTMLElement>('[data-tv-card-key]');
    return card ? `${card.closest('section')?.getAttribute('aria-label') ?? ''}:${card.getAttribute('data-tv-card-key')}` : null;
  };
  const markFocus = () => {
    focusedCard?.removeAttribute('data-tv-focused');
    focusedCard = (doc.activeElement as HTMLElement | null)?.closest<HTMLElement>('[data-tv-card]') ?? null;
    focusedCard?.setAttribute('data-tv-focused', '');
    if (focusedCard) rememberedCard = cardKey(focusedCard);
    const active = doc.activeElement as HTMLElement | null;
    if (active?.closest('#scrollable-page')) playerReturn = active;
  };
  doc.addEventListener('focusin', markFocus);
  markFocus();
  const invalidate = () => { cached = null; };
  const observer = new MutationObserver(records => {
    // Progress/clock paint changes opacity and transform only, not navigation geometry.
    if (records.some(record => !((record.type === 'childList' || (record.type === 'attributes' && record.attributeName === 'style')) && (record.target as HTMLElement).hasAttribute('data-tv-playback-paint')))) invalidate();
  });
  observer.observe(doc.body, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['hidden', 'disabled', 'tabindex', 'aria-hidden', 'aria-disabled', 'aria-modal', 'style'] });
  doc.addEventListener('scroll', invalidate, true);
  doc.addEventListener('load', invalidate, true);
  doc.defaultView?.addEventListener('resize', invalidate);

  function candidates() {
    const modal = [...doc.querySelectorAll<HTMLElement>('[aria-modal="true"]')].filter(el => el.getClientRects().length).at(-1);
    if (cached && cachedModal === modal && performance.now() - measuredAt < 250 && cached.every(item => item.element.isConnected)) return cached;
    cachedModal = modal;
    const styleCache = new Map<Element, CSSStyleDeclaration>();
    const styleOf = (el: Element) => {
      let style = styleCache.get(el);
      if (!style) { style = getComputedStyle(el); styleCache.set(el, style); }
      return style;
    };
    cached = [...(modal ?? doc).querySelectorAll<HTMLElement>(SELECTOR)].filter(el => {
      if (el.tabIndex < 0 || el.matches(':disabled,[aria-disabled="true"]') || el.closest('[hidden],[inert],[aria-hidden="true"],[data-tv-skip-spatial]')) return false;
      if (!el.getClientRects().length || styleOf(el).visibility === 'hidden') return false;
      // Ignore controls inside invisible hover layers, but allow a control whose
      // own opacity becomes visible on keyboard focus (e.g. the track menu).
      for (let parent = el.parentElement; parent && parent !== doc.body; parent = parent.parentElement) {
        if (styleOf(parent).opacity === '0') return false;
      }
      return true;
    }).map(element => {
      const rect = element.getBoundingClientRect();
      return { element, rect, horizontallyVisible: horizontallyVisible(element, rect, styleOf) };
    });
    measuredAt = performance.now();
    return cached;
  }

  function reveal(element: HTMLElement) {
    const page = element.closest<HTMLElement>('#scrollable-page');
    if (!page) {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      if (element.closest('[data-tv-sidebar]')) invalidate();
      return;
    }
    // Reveal the horizontal shelf independently. scrollIntoView also scrolls
    // the page/body and can strand focus behind the sticky header or player.
    for (let parent = element.parentElement; parent && parent !== page; parent = parent.parentElement) {
      if (parent.scrollWidth <= parent.clientWidth || !/auto|scroll/.test(getComputedStyle(parent).overflowX)) continue;
      const bounds = parent.getBoundingClientRect(), rect = element.getBoundingClientRect();
      if (rect.left < bounds.left + 12) parent.scrollLeft += rect.left - bounds.left - 12;
      else if (rect.right > bounds.right - 12) parent.scrollLeft += rect.right - bounds.right + 12;
    }
    const bounds = page.getBoundingClientRect(), rect = element.getBoundingClientRect();
    const reservedPlayer = !!page.querySelector('[data-tv-home]');
    const top = bounds.top + 32, bottom = bounds.bottom - (reservedPlayer ? 16 : Math.min(150, bounds.height / 4));
    let target = page.scrollTop;
    if (rect.top < top) target = Math.max(0, page.scrollTop + rect.top - top);
    else if (rect.bottom > bottom) target += rect.bottom - bottom;
    if (target !== page.scrollTop) {
      const now=performance.now();
      const smooth=!!element.closest('[data-tv-recents]') && now-lastScrollAt>220 && !doc.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(smooth) page.scrollTo({top:target,behavior:'smooth'}); else page.scrollTop=target;
      lastScrollAt=now;
    }
    // A held key may arrive before the browser dispatches its scroll event.
    invalidate();
  }

  function horizontallyVisible(element: HTMLElement, rect: DOMRect, styleOf: (el: Element) => CSSStyleDeclaration) {
    for (let parent = element.parentElement; parent && parent !== doc.body; parent = parent.parentElement) {
      if (parent.scrollWidth <= parent.clientWidth || !/auto|scroll/.test(styleOf(parent).overflowX)) continue;
      const bounds = parent.getBoundingClientRect();
      if (rect.right <= bounds.left || rect.left >= bounds.right) return false;
    }
    return true;
  }

  return {
    move(direction: Direction) {
      const items = candidates();
      if (!items.length) return;
      let active = doc.activeElement as HTMLElement;
      let current = items.find(item => item.element === active);
      if (!current && active === doc.body && rememberedCard) {
        current = items.find(item => item.element.hasAttribute('data-tv-primary') && cardKey(item.element) === rememberedCard);
        if (current) { active = current.element; active.focus({ preventScroll: true }); }
      }
      if (!current) {
        (items.find(item => item.element.hasAttribute('data-tv-default-focus')) ?? items[0])!.element.focus({ preventScroll: true });
        return;
      }
      const a = current.rect, cx = a.left + a.width / 2, cy = a.top + a.height / 2;
      const card = active.closest('[data-tv-card]');
      const horizontal = direction === 'Left' || direction === 'Right';
      const page = active.closest<HTMLElement>('#scrollable-page');
      const sidebar = active.closest('[data-tv-sidebar]');
      const miniPlayer = active.closest('[data-tv-mini-player]');
      const searchInput=doc.querySelector<HTMLInputElement>('[data-tv-search-field] input');
      const searchResults=doc.querySelector('[data-tv-search-results]');
      const resultItems=searchResults ? items.filter(item=>searchResults.contains(item.element) && (item.element.hasAttribute('data-tv-primary') || !searchResults.querySelector('[data-tv-primary]'))) : [];
      if (active===searchInput && searchInput?.readOnly && direction==='Down') {
        const first=resultItems[0];if(first){first.element.focus({preventScroll:true});reveal(first.element);}return;
      }
      if (direction==='Up' && resultItems[0]?.element===active && searchInput) {
        searchInput.focus({preventScroll:true});reveal(searchInput);return;
      }

      if (miniPlayer && direction === 'Up' && playerReturn?.isConnected && items.some(item => item.element === playerReturn)) {
        playerReturn.focus({ preventScroll: true });
        reveal(playerReturn);
        return;
      }
      if (miniPlayer && direction === 'Down' && playerReturn?.isConnected) {
        const origin = playerReturn.getBoundingClientRect();
        const next = items.filter(item => item.element.closest('#scrollable-page') && item.element.hasAttribute('data-tv-primary') && item.rect.top > origin.top + 2)
          .sort((a, b) => (a.rect.top - origin.top + Math.abs(a.rect.left - origin.left) * 3) - (b.rect.top - origin.top + Math.abs(b.rect.left - origin.left) * 3))[0];
        if (next) { next.element.focus({ preventScroll: true }); reveal(next.element); }
        return;
      }
      if (sidebar && direction === 'Right') {
        const content = items.filter(item => item.element.closest('#scrollable-page'));
        const next = content.find(item => item.element === playerReturn) ?? content.find(item => item.element.hasAttribute('data-tv-primary')) ?? content[0];
        if (next) { next.element.focus({preventScroll:true}); reveal(next.element); }
        return;
      }
      if (miniPlayer && horizontal) {
        const allControls = items.filter(item => miniPlayer.contains(item.element));
        const ordered = allControls.filter(item => item.element.closest('[data-tv-player-order]'));
        const controls = ordered.length ? ordered.sort((a,b) => Number(a.element.closest('[data-tv-player-order]')!.getAttribute('data-tv-player-order')) - Number(b.element.closest('[data-tv-player-order]')!.getAttribute('data-tv-player-order'))) : allControls;
        const index = controls.findIndex(item => item.element === active);
        controls[index + (direction === 'Right' ? 1 : -1)]?.element.focus({ preventScroll: true });
        return;
      }
      const trackGrid = card?.closest('.tv-shelf-tracks');
      if (trackGrid && horizontal) {
        const sameRow = items.filter(item => trackGrid.contains(item.element) && item.element.hasAttribute('data-tv-primary') && item.element.closest('[data-tv-card]') !== card && Math.abs(item.rect.top - a.top) < Math.max(a.height, item.rect.height) / 2);
        const next = sameRow.filter(item => direction === 'Right' ? item.rect.left > a.left : item.rect.left < a.left)
          .sort((x,y) => Math.abs(x.rect.left-a.left)-Math.abs(y.rect.left-a.left))[0];
        if (next) { next.element.focus({preventScroll:true}); reveal(next.element); return; }
        if (direction === 'Right') return;
      }
      const recents=active.closest('[data-tv-recents]');
      if(recents && card && horizontal){
        const primary=card.querySelector<HTMLElement>('[data-tv-primary]');
        const menu=card.querySelector<HTMLElement>('button[aria-haspopup]');
        if(direction==='Right'){menu?.focus({preventScroll:true});return;}
        if(active!==primary && primary){primary.focus({preventScroll:true});return;}
      }
      if(recents && !horizontal){
        const controls=items.filter(item=>recents.contains(item.element) && (item.element.hasAttribute('data-tv-primary') || item.element.hasAttribute('data-tv-load-more')));
        const index=controls.findIndex(item=>item.element===active || (!!card && item.element.closest('[data-tv-card]')===card));
        const next=controls[index+(direction==='Down'?1:-1)];
        if(next){next.element.focus({preventScroll:true});reveal(next.element);return;}
        if(direction==='Up'){if(page)page.scrollTop=0;return;}
        const play=items.find(item=>item.element.hasAttribute('data-tv-player-toggle'));play?.element.focus({preventScroll:true});return;
      }
      const settings = active.closest('[data-tv-settings]');
      if (settings && !horizontal) {
        const controls = items.filter(item => settings.contains(item.element));
        const index = controls.findIndex(item => item.element === active);
        const next = controls[index + (direction === 'Down' ? 1 : -1)];
        if (next) { next.element.focus({ preventScroll: true }); reveal(next.element); }
        return;
      }
      let best: Candidate | null = null, bestScore = Infinity;
      for (const item of items) {
        if (item.element === active) continue;
        if (page && horizontal && item.element.closest('[data-tv-mini-player]')) continue;
        if (!horizontal && page && !page.contains(item.element)) continue;
        if (!horizontal && sidebar && !sidebar.contains(item.element)) continue;
        if (!horizontal && !item.horizontallyVisible) continue;
        if (!horizontal && card && item.element.closest('[data-tv-card]') === card) continue;
        if (card && horizontal && item.element.closest('[data-tv-card]')) {
          if (item.element.closest('[data-tv-card]') === card || !item.element.hasAttribute('data-tv-primary')) continue;
        }
        const b = item.rect;
        const dx = b.left + b.width / 2 - cx, dy = b.top + b.height / 2 - cy;
        let distance: number, offset: number;
        if (direction === 'Left' && dx < -2) { distance = -dx; offset = Math.abs(dy); }
        else if (direction === 'Right' && dx > 2) { distance = dx; offset = Math.abs(dy); }
        else if (direction === 'Up' && dy < -2) { distance = -dy; offset = Math.abs(dx); }
        else if (direction === 'Down' && dy > 2) { distance = dy; offset = Math.abs(dx); }
        else continue;
        const aligned = horizontal ? b.bottom > a.top + 2 && b.top < a.bottom - 2 : b.right > a.left + 2 && b.left < a.right - 2;
        const secondaryCardControl = card && !horizontal && item.element.closest('[data-tv-card]') && !item.element.hasAttribute('data-tv-primary');
        const score = distance + offset * 3 + (aligned ? 0 : 5000) + (secondaryCardControl ? 1500 : 0);
        if (score < bestScore) { bestScore = score; best = item; }
      }
      // The player is a fixed destination, not another shelf in the endless feed.
      // Down from the lowest visible row enters it before scrolling to hidden cards.
      const player = items.find(item => item.element.hasAttribute('data-tv-player-toggle'));
      if (page && direction === 'Down' && player) {
        const pill = player.element.closest<HTMLElement>('[data-tv-mini-player]');
        const boundary = pill?.getBoundingClientRect().top ?? Infinity;
        if (!best || ((card || active.hasAttribute('data-tv-primary')) && best.rect.bottom > boundary - 24)) {
          playerReturn = active;
          player.element.focus({ preventScroll: true });
          return;
        }
      }
      if (sidebar && direction === 'Down' && !best && player) {
        player.element.focus({preventScroll:true}); return;
      }
      if (page && direction === 'Left' && (!best || best.element.closest('[data-tv-sidebar]'))) {
        const sidebarItem = items.find(item => item.element.closest('[data-tv-sidebar]') && item.element.getAttribute('aria-current') === 'page') ?? items.find(item => item.element.closest('[data-tv-sidebar]'));
        if (sidebarItem) sidebarItem.element.focus({preventScroll:true});
        return;
      }
      if (best?.element.closest('[data-tv-mini-player]') && !miniPlayer && player) {
        player.element.focus({preventScroll:true}); return;
      }
      if (best) {
        best.element.focus({ preventScroll: true });
        reveal(best.element);
      } else if (page && direction === 'Up' && page.scrollTop > 0) {
        page.scrollTop = 0;
        page.querySelector<HTMLElement>('[data-tv-primary],button:not(:disabled),a[href]')?.focus({ preventScroll: true });
        invalidate();
      }
    },
    dispose() {
      observer.disconnect();
      doc.removeEventListener('focusin', markFocus);
      focusedCard?.removeAttribute('data-tv-focused');
      doc.removeEventListener('scroll', invalidate, true);
      doc.removeEventListener('load', invalidate, true);
      doc.defaultView?.removeEventListener('resize', invalidate);
    },
  };
}

export function tvKey(event: Pick<KeyboardEvent, 'key' | 'keyCode'>): string {
  return ({ 13: 'Enter', 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 10009: 'BrowserBack' } as Record<number, string>)[event.keyCode] ?? event.key;
}

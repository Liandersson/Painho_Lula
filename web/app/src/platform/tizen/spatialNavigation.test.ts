// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSpatialNavigation, tvKey } from './spatialNavigation';

const navigators: ReturnType<typeof createSpatialNavigation>[] = [];
function button(parent: HTMLElement, x: number, y = 0, primary = false) {
  const el = document.createElement('button');
  if (primary) el.setAttribute('data-tv-primary', '');
  parent.append(el);
  const rect = new DOMRect(x, y, 40, 40);
  vi.spyOn(el, 'getClientRects').mockReturnValue([rect] as unknown as DOMRectList);
  const measured = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect);
  el.scrollIntoView = vi.fn();
  return { el, measured };
}
afterEach(() => { navigators.splice(0).forEach(n => n.dispose()); document.body.innerHTML = ''; vi.restoreAllMocks(); });

describe('TV spatial navigation', () => {
  it('moves between the readonly search bar and the first result without stopping on Clear',()=>{
    const field=document.createElement('div');field.setAttribute('data-tv-search-field','');document.body.append(field);
    const input=document.createElement('input');input.readOnly=true;field.append(input);const r=new DOMRect(700,0,600,60);vi.spyOn(input,'getClientRects').mockReturnValue([r] as unknown as DOMRectList);vi.spyOn(input,'getBoundingClientRect').mockReturnValue(r);input.scrollIntoView=vi.fn();button(field,1250,10);
    const results=document.createElement('div');results.setAttribute('data-tv-search-results','');document.body.append(results);const first=button(results,600,150,true),second=button(results,1100,150,true);
    const nav=createSpatialNavigation();navigators.push(nav);input.focus();nav.move('Down');expect(document.activeElement).toBe(first.el);nav.move('Up');expect(document.activeElement).toBe(input);expect(input.readOnly).toBe(true);expect(document.activeElement).not.toBe(second.el);
  });

  it('enters on Play, follows explicit player order, restores exact content and crosses the sidebar predictably',()=>{
    const sidebar=document.createElement('nav');sidebar.setAttribute('data-tv-sidebar','');document.body.append(sidebar);
    const home=button(sidebar,0,100);home.el.setAttribute('aria-current','page');button(sidebar,0,160);
    const page=document.createElement('main');page.id='scrollable-page';document.body.append(page);vi.spyOn(page,'getBoundingClientRect').mockReturnValue(new DOMRect(200,0,1720,900));
    const origin=button(page,600,500,true);const pill=document.createElement('div');pill.setAttribute('data-tv-mini-player','');document.body.append(pill);
    const controls=Array.from({length:10},(_,i)=>{const item=button(pill,300+i*60,950);item.el.setAttribute('data-tv-player-order',String(i));return item.el;});
    controls[2]!.setAttribute('data-tv-player-toggle','');const unrelated=button(pill,500,900);
    const nav=createSpatialNavigation();navigators.push(nav);origin.el.focus();nav.move('Down');expect(document.activeElement).toBe(controls[2]);
    for(let i=3;i<10;i++){nav.move('Right');expect(document.activeElement).toBe(controls[i]);}
    nav.move('Right');expect(document.activeElement).toBe(controls[9]);
    for(let i=8;i>=0;i--){nav.move('Left');expect(document.activeElement).toBe(controls[i]);}
    nav.move('Up');expect(document.activeElement).toBe(origin.el);expect(document.activeElement).not.toBe(unrelated.el);
    nav.move('Left');expect(document.activeElement).toBe(home.el);nav.move('Right');expect(document.activeElement).toBe(origin.el);
  });

  it('crosses two track columns on the same row and does not jump diagonally at the right edge',()=>{
    const grid=document.createElement('ul');grid.className='tv-shelf-tracks';document.body.append(grid);
    const rows=[0,100,200].map(y=>[300,1100].map(x=>{
      const card=document.createElement('div');card.setAttribute('data-tv-card','');grid.append(card);
      const primary=button(card,x,y,true);button(card,x+100,y+10);return primary.el;
    }));
    const nav=createSpatialNavigation();navigators.push(nav);rows[1]![0]!.focus();
    nav.move('Right');expect(document.activeElement).toBe(rows[1]![1]);
    nav.move('Right');expect(document.activeElement).toBe(rows[1]![1]);
    nav.move('Left');expect(document.activeElement).toBe(rows[1]![0]);
    nav.move('Down');expect(document.activeElement).toBe(rows[2]![0]);
    nav.move('Up');expect(document.activeElement).toBe(rows[1]![0]);
  });

  it('scrolls Settings down through every control instead of entering the fixed player', () => {
    const page=document.createElement('main'); page.id='scrollable-page'; document.body.append(page);
    vi.spyOn(page,'getBoundingClientRect').mockReturnValue(new DOMRect(300,0,1620,1080));
    const settings=document.createElement('div'); settings.setAttribute('data-tv-settings',''); page.append(settings);
    const controls=[button(settings,1000,600),button(settings,1000,1200),button(settings,500,1500)];
    const pill=document.createElement('div'); pill.setAttribute('data-tv-mini-player',''); document.body.append(pill);
    vi.spyOn(pill,'getBoundingClientRect').mockReturnValue(new DOMRect(400,900,1180,100));
    const play=button(pill,600,920); play.el.setAttribute('data-tv-player-toggle','');
    const nav=createSpatialNavigation(); navigators.push(nav); controls[0]!.el.focus();
    nav.move('Down'); expect(document.activeElement).toBe(controls[1]!.el); expect(page.scrollTop).toBeGreaterThan(0);
    nav.move('Down'); expect(document.activeElement).toBe(controls[2]!.el);
    nav.move('Down'); expect(document.activeElement).toBe(controls[2]!.el);
    nav.move('Up'); expect(document.activeElement).toBe(controls[1]!.el);
  });
  it('reuses geometry when only the playback fill is painted', async () => {
    const a=button(document.body,0),b=button(document.body,100),c=button(document.body,200);
    const fill=document.createElement('div');fill.setAttribute('data-tv-playback-paint','');document.body.append(fill);
    const nav=createSpatialNavigation();navigators.push(nav);a.el.focus();nav.move('Right');
    fill.style.setProperty('--progress','0.5');fill.textContent='0:05';await Promise.resolve();nav.move('Right');
    expect(document.activeElement).toBe(c.el);expect(b.measured).toHaveBeenCalledTimes(1);
  });

  it('enters the fixed player before hidden shelves, returns Up, and continues the feed Down', () => {
    const page=document.createElement('main'); page.id='scrollable-page'; document.body.append(page);
    vi.spyOn(page,'getBoundingClientRect').mockReturnValue(new DOMRect(300,0,1620,1080));
    const a=button(page,600,600,true), b=button(page,600,1100,true);
    const pill=document.createElement('div'); pill.setAttribute('data-tv-mini-player',''); document.body.append(pill);
    vi.spyOn(pill,'getBoundingClientRect').mockReturnValue(new DOMRect(400,900,1180,100));
    const play=button(pill,600,920); play.el.setAttribute('data-tv-player-toggle','');
    const next=button(pill,700,920);
    const nav=createSpatialNavigation(); navigators.push(nav);
    a.el.focus(); nav.move('Down'); expect(document.activeElement).toBe(play.el); expect(page.scrollTop).toBe(0);
    nav.move('Right'); expect(document.activeElement).toBe(next.el);
    nav.move('Up'); expect(document.activeElement).toBe(a.el);
    nav.move('Down'); nav.move('Down'); expect(document.activeElement).toBe(b.el); expect(page.scrollTop).toBeGreaterThan(0);
  });

  it('returns from lower Home shelves to the top without jumping into the sidebar', () => {
    const sidebar = document.createElement('nav'); sidebar.setAttribute('data-tv-sidebar',''); document.body.append(sidebar);
    button(sidebar,0,200);
    const page = document.createElement('main'); page.id='scrollable-page'; document.body.append(page); page.scrollTop=800;
    vi.spyOn(page,'getBoundingClientRect').mockReturnValue(new DOMRect(300,0,1620,1080));
    const cards = [100,700,1300].map((contentY,i) => {
      const card=document.createElement('div'); card.setAttribute('data-tv-card',''); card.setAttribute('data-tv-card-key',String(i)); page.append(card);
      const item=button(card,500,0,true);
      item.measured.mockImplementation(() => new DOMRect(500,contentY-page.scrollTop,200,100));
      return item.el;
    });
    const nav=createSpatialNavigation(); navigators.push(nav);
    cards[2]!.focus(); nav.move('Up'); expect(document.activeElement).toBe(cards[1]);
    nav.move('Up'); expect(document.activeElement).toBe(cards[0]);
    nav.move('Up'); expect(page.scrollTop).toBe(0);
    expect(document.activeElement?.closest('[data-tv-sidebar]')).toBeNull();
  });

  it('keeps one stable card indicator and restores the card after a feed rerender', () => {
    const first=document.createElement('div'); first.setAttribute('data-tv-card',''); first.setAttribute('data-tv-card-key','A'); document.body.append(first);
    const a=button(first,0,0,true);
    const second=document.createElement('div'); second.setAttribute('data-tv-card',''); second.setAttribute('data-tv-card-key','B'); document.body.append(second);
    const b=button(second,100,0,true);
    const nav=createSpatialNavigation(); navigators.push(nav);
    a.el.focus(); nav.move('Right');
    expect(first.hasAttribute('data-tv-focused')).toBe(false);
    expect(second.hasAttribute('data-tv-focused')).toBe(true);
    b.el.remove(); const replacement=button(second,100,0,true);
    nav.move('Left');
    expect(replacement.el.isConnected).toBe(true);
    expect(document.activeElement).toBe(a.el);
    expect(first.hasAttribute('data-tv-focused')).toBe(true);
    expect(second.hasAttribute('data-tv-focused')).toBe(false);
  });

  it('switches focus scope to a newly opened fullscreen player without reusing background controls', () => {
    const background = button(document.body, 0);
    const nav = createSpatialNavigation(); navigators.push(nav);
    background.el.focus(); nav.move('Right');
    const modal = document.createElement('div'); modal.setAttribute('aria-modal', 'true'); document.body.append(modal);
    vi.spyOn(modal, 'getClientRects').mockReturnValue([new DOMRect(0,0,1920,1080)] as unknown as DOMRectList);
    const play = button(modal, 600); play.el.setAttribute('data-tv-default-focus', '');
    const next = button(modal, 700);
    nav.move('Right');
    expect(document.activeElement).toBe(play.el);
    nav.move('Right');
    expect(document.activeElement).toBe(next.el);
  });

  it('moves to the next card immediately, skips its duplicate controls, and reuses layout measurements', () => {
    const card = document.createElement('div'); card.setAttribute('data-tv-card', ''); document.body.append(card);
    const a = button(card, 0, 0, true); button(card, 30);
    const card2 = card.cloneNode(false) as HTMLElement; document.body.append(card2);
    const b = button(card2, 100, 0, true);
    const card3 = card.cloneNode(false) as HTMLElement; document.body.append(card3);
    const c = button(card3, 200, 0, true);
    const nav = createSpatialNavigation(); navigators.push(nav);
    a.el.focus(); nav.move('Right');
    expect(document.activeElement).toBe(b.el);
    expect(b.el.scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    nav.move('Right');
    expect(document.activeElement).toBe(c.el);
    expect(a.measured).toHaveBeenCalledTimes(1);
    expect(b.measured).toHaveBeenCalledTimes(1);
  });

  it('does not move into hidden hover layers or disabled controls', () => {
    const a = button(document.body, 0);
    const hidden = document.createElement('div'); hidden.style.opacity = '0'; document.body.append(hidden);
    button(hidden, 45);
    const disabled = button(document.body, 50); disabled.el.disabled = true;
    const next = button(document.body, 100);
    const nav = createSpatialNavigation(); navigators.push(nav);
    a.el.focus(); nav.move('Right');
    expect(document.activeElement).toBe(next.el);
  });

  it('recognizes controls that report only Samsung key codes', () => {
    expect(tvKey({ key: 'Unidentified', keyCode: 39 })).toBe('ArrowRight');
    expect(tvKey({ key: '', keyCode: 13 })).toBe('Enter');
    expect(tvKey({ key: '', keyCode: 10009 })).toBe('BrowserBack');
  });
});

import { useEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router';
import { PageHeader } from '@/components/PageHeader';
import { TrackLockup } from '@/components/music/Lockups';
import { trackItem } from '@/components/music/ShelfView';
import { playTrack } from '@/components/music/play';
import { useLocalRecentlyPlayed } from '@/platform/tizen/recentlyPlayed';

const BATCH = 20;
const position = { videoId: '', scrollTop: 0, visible: BATCH };
export default function RecentsPage() {
  // Keep order stable while this page is open; refresh from storage on the next visit.
  const [tracks] = useState(() => [...useLocalRecentlyPlayed.getState().entries]
    .sort((a,b) => (b.lastStartedAt ?? b.playedAt) - (a.lastStartedAt ?? a.playedAt)).slice(0,200).map(e=>e.track));
  const [visible, setVisible] = useState(Math.max(BATCH, position.visible));
  const navigation = useNavigationType();
  const root = useRef<HTMLDivElement>(null), sentinel = useRef<HTMLDivElement>(null);
  const focusNext = useRef<number | null>(null);
  const more = () => { focusNext.current = visible; setVisible(n=>Math.min(tracks.length,n+BATCH)); };
  useEffect(() => {
    const page=document.getElementById('scrollable-page');
    if (!page) return;
    const frame=requestAnimationFrame(()=>{
      page.scrollTop=position.scrollTop;
      if (navigation==='POP' && position.videoId) {
        const items=[...root.current!.querySelectorAll<HTMLElement>('[data-tv-primary]')];
        const target=items.find(el=>el.closest('[data-tv-card-key]')?.getAttribute('data-tv-card-key')===position.videoId) ?? items[0];
        target?.focus({preventScroll:true});target?.scrollIntoView({block:'nearest',behavior:'instant'});
      }
    });
    const save=()=>{position.scrollTop=page.scrollTop;};page.addEventListener('scroll',save,{passive:true});
    return ()=>{cancelAnimationFrame(frame);save();page.removeEventListener('scroll',save);};
  },[navigation]);
  useEffect(()=>{
    position.visible=visible;
    if(focusNext.current!==null){const next=root.current?.querySelectorAll<HTMLElement>('[data-tv-primary]')[focusNext.current];next?.focus({preventScroll:true});next?.scrollIntoView({block:'nearest',behavior:'smooth'});focusNext.current=null;}
  },[visible]);
  useEffect(()=>{
    if(visible>=tracks.length || !sentinel.current)return;
    const observer=new IntersectionObserver(entries=>{
      if(entries[0]?.isIntersecting)setVisible(n=>Math.min(tracks.length,n+BATCH));
    },{root:document.getElementById('scrollable-page'),rootMargin:'180px'});
    observer.observe(sentinel.current);return ()=>observer.disconnect();
  },[visible,tracks.length]);
  return <div ref={root} data-tv-recents onFocusCapture={event=>{
    const id=(event.target as HTMLElement).closest('[data-tv-card-key]')?.getAttribute('data-tv-card-key');if(id)position.videoId=id;
  }}>
    <PageHeader title="Recents"/>
    {!tracks.length ? <p className="tv-history-empty">Você ainda não ouviu nenhuma música.</p> : <ul className="tv-recents-list">{tracks.slice(0,visible).map(track=><li key={track.videoId}><TrackLockup item={trackItem(track)} onPlay={()=>playTrack(track,undefined,{title:'Recents',type:'home'})}/></li>)}</ul>}
    <div ref={sentinel}/>
    {visible<tracks.length && <button data-tv-load-more className="tv-recents-more" onClick={more}>Carregar mais músicas</button>}
  </div>;
}

'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { enabled, picker, tracks, getState, subscribe, toggle, select, setVolume } from '../lib/music';

/**
 * The music button. With one track it is a plain play/pause. With several (event.music.picker) a tap opens a
 * small sheet: choose a song (it cross-fades in so you can compare by ear), play/pause, and a volume slider.
 * Set "picker": false in config/event.json when you have decided, and it becomes a plain button again.
 */
export default function MusicPlayer() {
  const s = useSyncExternalStore(subscribe, getState, getState);
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!pop.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open]);

  if (!enabled) return null;

  const label = picker ? 'Music options' : s.playing ? 'Pause music' : 'Play music';
  return (
    <>
      {picker && open && (
        <div ref={pop} className={`mp__pop ${s.playing ? 'mp__pop--on' : ''}`} role="group" aria-label="Music">
          <div className="mp__hd">
            <b>Music</b>
            <button type="button" className="mp__pp" onClick={toggle} aria-label={s.playing ? 'Pause' : 'Play'}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                {s.playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5.5v13l11-6.5z" />}
              </svg>
            </button>
          </div>
          <ul className="mp__list">
            {tracks.map((t) => {
              const on = t.id === s.trackId;
              return (
                <li key={t.id}>
                  <label className={`mp__row ${on ? 'mp__row--on' : ''}`}>
                    <input type="radio" name="mp-track" checked={on} onChange={() => select(t.id)} />
                    <span className="mp__eq" aria-hidden="true"><i /><i /><i /></span>
                    <span className="mp__nm">{t.name}{t.sub && <small>{t.sub}</small>}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <label className="mp__vol">
            <span>Volume</span>
            <input type="range" min={0} max={1} step={0.05} value={s.volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" />
          </label>
        </div>
      )}
      <button ref={btn} className={`music ${s.playing ? 'music--on' : ''}`} type="button"
        onClick={() => (picker ? setOpen((o) => !o) : toggle())}
        aria-label={label} aria-pressed={picker ? undefined : s.playing} aria-expanded={picker ? open : undefined}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" />
          {!s.playing && <path d="M3 3l18 18" />}
        </svg>
        {s.playing && <span className="music__wave" aria-hidden="true"><i /><i /><i /></span>}
      </button>
    </>
  );
}

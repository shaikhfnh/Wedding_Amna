'use client';

import { useEffect, useRef, useState } from 'react';
import { event } from '../lib/event';
import { onceVisible } from '../lib/fx';

type Venue = {
  id: string; tab: string; tag: string; when: string; name: string; place: string;
  mapQuery: string; mapUrl: string; lat: number | null; lng: number | null;
};

const venues = event.venues as Venue[];
const DLAT = 0.0032, DLON = 0.0042; // tight box so the house sits dead-centre under our own pin

const embed = (v: Venue) => v.lat == null || v.lng == null ? null
  : `https://www.openstreetmap.org/export/embed.html?bbox=${v.lng - DLON},${v.lat - DLAT},${v.lng + DLON},${v.lat + DLAT}&layer=mapnik`;
const googleUrl = (v: Venue) => v.mapUrl
  || (v.lat != null ? `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.mapQuery)}`);
const appleUrl = (v: Venue) => v.lat != null
  ? `https://maps.apple.com/?ll=${v.lat},${v.lng}&q=${encodeURIComponent(v.name)}`
  : `https://maps.apple.com/?q=${encodeURIComponent(v.mapQuery)}`;

const Pin = () => (
  <svg viewBox="0 0 30 40"><path d="M15 39C6 28 2 22 2 14a13 13 0 1 1 26 0c0 8-4 14-13 25z" fill="#c24763" stroke="#e9cf8a" strokeWidth="2.4" /><circle cx="15" cy="14" r="4.6" fill="#fffaf4" stroke="#c9a24d" strokeWidth="1" /></svg>
);

/**
 * Where — two places, one switcher. The Reception (the main event) is shown first;
 * the Nikah venue is one tap away. A sliding pill switches between them, the maps
 * cross-fade and the rose pin drops again. Keyboard: ← → on the tabs. No API key anywhere.
 */
export default function VenuePanel() {
  const root = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  const [apple, setApple] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const v = venues[i];

  useEffect(() => { setApple(/iPhone|iPad|iPod|Macintosh|Mac OS X/.test(navigator.userAgent)); }, []);
  useEffect(() => {
    const el = root.current; if (!el) return;
    return onceVisible(el, () => el.classList.add('screen--in', 'vp--drop'), 0.25);
  }, []);

  const pick = (n: number, focus = false) => { setI(n); setCopied(false); if (focus) tabs.current[n]?.focus(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); pick((i + 1) % venues.length, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); pick((i - 1 + venues.length) % venues.length, true); }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${v.name}, ${v.place.replace(' · ', ', ')}`); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  return (
    <section ref={root} id="map" className="screen vp" aria-labelledby="vp-h">
      <p className="screen__eyebrow" id="vp-h">Where</p>

      <p className="vp__script" aria-hidden="true">Find us</p>

      <div className="vp__panel">
        <div className="vp__arch">
          <div className="vp__map" id="vp-p" role="tabpanel" aria-labelledby={`vp-t-${v.id}`}>
            {venues.map((x, n) => {
              const src = embed(x);
              return (
                <div key={x.id} className={`vp__layer ${n === i ? 'vp__layer--on' : ''}`} aria-hidden={n !== i}>
                  {src
                    ? <iframe className="vp__frame" src={src} title={`Map showing ${x.name}`} loading="lazy" tabIndex={-1} referrerPolicy="no-referrer-when-downgrade" />
                    : <div className="vp__soon"><span className="vp__soon-pin"><Pin /></span><span>Tap “Open in Maps” for directions</span></div>}
                  {src && n === i && <span className="vp__pin" key={x.id} aria-hidden="true"><Pin /></span>}
                </div>
              );
            })}
          </div>

          <div className="vp__tabs" role="tablist" aria-label="Choose a location" onKeyDown={onKey} style={{ ['--i' as string]: i, ['--n' as string]: venues.length }}>
            <span className="vp__pill" aria-hidden="true" />
            {venues.map((x, n) => (
              <button key={x.id} ref={(el) => { tabs.current[n] = el; }} role="tab" id={`vp-t-${x.id}`} aria-selected={i === n} aria-controls="vp-p"
                tabIndex={i === n ? 0 : -1} type="button" className="vp__tab" onClick={() => pick(n)}>
                {x.tab}
              </button>
            ))}
          </div>
        </div>

        <div className="vp__body" key={v.id}>
          <span className="vp__tag">{v.tag} · {v.when}</span>
          <span className="vp__name">{v.name}</span>
          <span className="vp__addr">{v.place}</span>
          <div className="vp__acts">
            <a className="wb wb--solid" href={apple ? appleUrl(v) : googleUrl(v)} target="_blank" rel="noopener noreferrer">
              <span>Open in Maps</span>
              <svg className="wb__i" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9 9 3M4.5 3H9v4.5" /></svg>
            </a>
            <button type="button" className={`wb wb--glass ${copied ? 'wb--done' : ''}`} onClick={copy}>
              <svg className="wb__i" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{copied ? <path d="m3.5 8.5 3 3 6-7" /> : <><rect x="5.5" y="5.5" width="8" height="8" rx="1.8" /><path d="M10.5 5.5v-1a1.8 1.8 0 0 0-1.8-1.8H4.5a1.8 1.8 0 0 0-1.8 1.8v4.2a1.8 1.8 0 0 0 1.8 1.8h1" /></>}</svg>
              <span>{copied ? 'Copied' : 'Copy address'}</span>
            </button>
          </div>
        </div>

        <p className="vp__credit">Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors</p>
      </div>
    </section>
  );
}
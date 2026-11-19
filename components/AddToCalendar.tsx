'use client';

import { useEffect, useRef, useState } from 'react';
import { ICS_BOTH, icsPath, googleUrl, outlookUrl, office365Url, yahooUrl } from '../lib/calendar';
import { events, reception, type Ev } from '../lib/event';

type Platform = 'ios' | 'mac' | 'android' | 'desktop';

function detect(): { platform: Platform; inApp: boolean } {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const mac = !ios && /Macintosh|Mac OS X/.test(ua);
  const android = /Android/.test(ua);
  const inApp = /FBAN|FBAV|Instagram|Snapchat|MicroMessenger|Twitter|; wv\)/.test(ua);
  return { platform: ios ? 'ios' : android ? 'android' : mac ? 'mac' : 'desktop', inApp };
}

const Chev = () => (
  <svg className="xb__chev" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
);

type Opt = { id: string; label: string; href: string; ext: boolean };

const CalIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="M12 13.2v4.6M9.7 15.5h4.6" />
  </svg>
);

/**
 * iPhone/iPad  -> Apple Calendar (.ics opens the native "Add to Calendar" sheet)
 * Android      -> Google Calendar (deep link opens the app / web)
 * Mac          -> menu with Apple Calendar first, then Google, Outlook, Microsoft 365, Yahoo
 * Windows/Linux-> menu with Google, Outlook, Microsoft 365, Yahoo (Apple Calendar is only offered on Apple devices)
 * Before the script runs (or with JS off) it is a plain link to the .ics file.
 */
export default function AddToCalendar() {
  const [info, setInfo] = useState<{ platform: Platform; inApp: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [ev, setEv] = useState<Ev>(reception);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setInfo(detect()), []);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const apple = info?.platform === 'ios' || info?.platform === 'mac';
  const every: Opt[] = [
    { id: 'apple', label: 'Apple Calendar', href: icsPath(ev), ext: false },
    { id: 'google', label: 'Google Calendar', href: googleUrl(ev), ext: true },
    { id: 'outlook', label: 'Outlook.com', href: outlookUrl(ev), ext: true },
    { id: 'o365', label: 'Microsoft 365', href: office365Url(ev), ext: true },
    { id: 'yahoo', label: 'Yahoo Calendar', href: yahooUrl(ev), ext: true },
  ];

  const all = every.filter((o) => o.id !== 'apple' || apple);
  const platform = info?.platform ?? null;
  const primary =
    platform === 'ios' ? all.find((o) => o.id === 'apple') ?? null : platform === 'android' ? all.find((o) => o.id === 'google') ?? null : null;
  const base = platform === 'ios' ? 'Add to Apple Calendar' : platform === 'android' ? 'Add to Google Calendar' : 'Add to Calendar';
  const label = base;
  const rest = primary ? all.filter((o) => o.id !== primary.id) : all;

  return (
    <div className="atc" ref={box} data-platform={platform ?? 'unknown'}>
      <div className="atc__which" role="radiogroup" aria-label="Which event to add">
        {[...events].reverse().map((e) => (
          <button key={e.key} type="button" role="radio" aria-checked={ev.key === e.key} className={`atc__chip ${ev.key === e.key ? 'atc__chip--on' : ''}`} onClick={() => { setEv(e); setOpen(false); }}>
            <b>{e.label}</b><small>{e.displayDay.slice(0, 3)} {e.displayDate} Jan · {e.displayTime}</small>
          </button>
        ))}
      </div>
      {primary ? (
        <a className="xb xb--primary" href={primary.href} {...(primary.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          <CalIcon /><span>{label}</span>
        </a>
      ) : platform === 'desktop' || platform === 'mac' ? (
        <button className={`xb xb--primary ${open ? 'xb--open' : ''}`} type="button" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <CalIcon /><span>{label}</span><Chev />
        </button>
      ) : (
        <a className="xb xb--primary" href={icsPath(ev)}>
          <CalIcon /><span>{label}</span>
        </a>
      )}
      <a className="atc__both" href={ICS_BOTH}>Add both days to your calendar</a>

      {platform && primary && (
        <button className="atc__more" type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          More calendars <Chev />
        </button>
      )}
      {platform && (
        <ul className={`atc__menu ${open ? 'atc__menu--open' : ''}`} role="menu" aria-hidden={!open}>
          {rest.map((o, n) => (
            <li key={o.id} role="none" style={{ ['--n' as string]: n }}>
              <a role="menuitem" tabIndex={open ? 0 : -1} href={o.href} {...(o.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} onClick={() => setOpen(false)}>
                <span>{o.label}</span>
                <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9 9 3M4.5 3H9v4.5" /></svg>
              </a>
            </li>
          ))}
        </ul>
      )}

      {info?.inApp && (
        <p className="atc__hint">
          Calendar buttons can be blocked inside this app. If nothing happens, open this page in Safari or Chrome.
        </p>
      )}
    </div>
  );
}
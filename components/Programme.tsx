'use client';

import { event, events, type Ev } from '../lib/event';

const Pin = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" />
  </svg>
);
const Clock = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
  </svg>
);

function Day({ e, main }: { e: Ev; main: boolean }) {
  const month = e.displayMonthYear.split(',')[0].trim();
  const year = e.displayMonthYear.split(',')[1]?.trim();
  return (
    <article className={`pg__day ${main ? 'pg__day--main' : ''}`} aria-labelledby={`pg-${e.key}`}>
      {main && <span className="pg__flag">The main celebration</span>}
      <header className="pg__head">
        <span className="pg__no" aria-hidden="true">{e.displayDate}</span>
        <div className="pg__when">
          <h3 id={`pg-${e.key}`} className="pg__name">{e.key === 'nikah' ? 'The Nikah' : 'The Reception'}</h3>
          <p className="pg__date">{e.displayDay}, {e.displayDate} {month} {year}</p>
          <p className="pg__hijri">{e.hijri}</p>
        </div>
      </header>
      <ul className="pg__facts">
        <li><Clock /><span>{e.displayTime} {event.tzLabel}</span></li>
        <li><Pin /><span><b>{e.line1.replace(/,$/, '')}</b><br />{e.line2.replace(/\.$/, '')}</span></li>
      </ul>
      <a className="pg__go" href={e.mapUrl} target="_blank" rel="noopener noreferrer">
        <span>Directions</span>
        <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9 9 3M4.5 3H9v4.5" /></svg>
      </a>
    </article>
  );
}

/** The two days of the celebration, in order: Nikah, then the Reception (the main event). */
export default function Programme() {
  return (
    <section id="days" className="pg" aria-labelledby="pg-h">
      <img className="pg__leaf pg__leaf--l" src="/art/leaf-a.webp" alt="" width={242} height={593} loading="lazy" decoding="async" aria-hidden="true" />
      <img className="pg__leaf pg__leaf--r" src="/art/leaf-c.webp" alt="" width={144} height={318} loading="lazy" decoding="async" aria-hidden="true" />

      <div className="rv pg__in">
        <p className="pg__eyebrow">The celebration</p>
        <h2 id="pg-h" className="pg__title">Two blessed days</h2>

        <div className="pg__line">
          <Day e={events[0]} main={false} />
          <span className="pg__knot" aria-hidden="true"><i /></span>
          <Day e={events[1]} main />
        </div>

      </div>
    </section>
  );
}

import raw from '../config/event.json';

export const event = raw;

/** The two events. The reception is the main one (it drives the countdown, the big date and the share preview). */
export interface Ev {
  key: 'reception' | 'nikah';
  label: string;          // "Reception"
  title: string;
  startMs: number;
  endMs: number;
  displayDay: string; displayDate: string; displayMonthYear: string; displayTime: string; hijri: string;
  line1: string; line2: string; addressOneLine: string; mapQuery: string; mapUrl: string;
}

const mk = (key: Ev['key'], label: string, o: {
  title: string; start: string; durationMinutes: number; displayDay: string; displayDate: string;
  displayMonthYear: string; displayTime: string; hijri: string;
  venue: { line1: string; line2: string; addressOneLine: string; mapQuery: string; mapUrl: string };
}): Ev => {
  const startMs = Date.parse(o.start);
  return {
    key, label, title: o.title, startMs, endMs: startMs + o.durationMinutes * 60_000,
    displayDay: o.displayDay, displayDate: o.displayDate, displayMonthYear: o.displayMonthYear, displayTime: o.displayTime, hijri: o.hijri,
    ...o.venue,
  };
};

export const reception = mk('reception', 'Reception', raw);
export const nikah = mk('nikah', 'Nikah', raw.nikah);
export const events: Ev[] = [nikah, reception];

export const startMs = reception.startMs;
export const endMs = reception.endMs;

/** bride first, as on the card */
export const names = `${raw.bride} & ${raw.groom}`;
export const fullNames = `${raw.brideFull} & ${raw.groomFull}`;

/** 20270102T053000Z */
export const toCalStamp = (ms: number) =>
  new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const siteUrl = () =>
  (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : raw.siteUrl) || '';

export const mapLinks = () => {
  const q = encodeURIComponent(raw.venue.mapQuery);
  return {
    google: raw.venue.mapUrl || `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: `https://maps.apple.com/?q=${q}`,
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
  };
};

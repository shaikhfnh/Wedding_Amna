import { event, events, toCalStamp, siteUrl, type Ev } from './event';

export const ICS_BOTH = '/fathima-amna-nirjas.ics';
export const icsPath = (e: Ev) => `/${e.key}.ics`;

const details = (e: Ev) => {
  const link = siteUrl();
  return [
    `${e.title}`,
    `${e.displayDay}, ${e.displayDate} ${e.displayMonthYear}, ${e.displayTime} ${event.tzLabel}.`,
    e.addressOneLine,
    'Kindly grace the occasion with your presence and duas.',
    link ? `Invitation: ${link}` : '',
  ].filter(Boolean).join('\n');
};

const enc = encodeURIComponent;
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

export function googleUrl(e: Ev) {
  const q = [
    'action=TEMPLATE', `text=${enc(e.title)}`, `dates=${toCalStamp(e.startMs)}/${toCalStamp(e.endMs)}`,
    `details=${enc(details(e))}`, `location=${enc(e.addressOneLine)}`, `ctz=${enc(event.timeZone)}`,
  ];
  return `https://calendar.google.com/calendar/render?${q.join('&')}`;
}

function outlookLike(base: string, e: Ev) {
  const q = [
    'path=/calendar/action/compose', 'rru=addevent', `subject=${enc(e.title)}`,
    `startdt=${enc(iso(e.startMs))}`, `enddt=${enc(iso(e.endMs))}`, `body=${enc(details(e))}`, `location=${enc(e.addressOneLine)}`,
  ];
  return `${base}?${q.join('&')}`;
}
export const outlookUrl = (e: Ev) => outlookLike('https://outlook.live.com/calendar/0/deeplink/compose', e);
export const office365Url = (e: Ev) => outlookLike('https://outlook.office.com/calendar/0/deeplink/compose', e);

export function yahooUrl(e: Ev) {
  const mins = Math.round((e.endMs - e.startMs) / 60000);
  const hh = String(Math.floor(mins / 60)).padStart(2, '0'), mm = String(mins % 60).padStart(2, '0');
  const q = ['v=60', `title=${enc(e.title)}`, `st=${toCalStamp(e.startMs)}`, `dur=${hh}${mm}`, `desc=${enc(details(e))}`, `in_loc=${enc(e.addressOneLine)}`];
  return `https://calendar.yahoo.com/?${q.join('&')}`;
}
export { events };

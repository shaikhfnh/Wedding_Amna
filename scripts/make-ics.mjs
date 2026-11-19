// Builds public/reception.ics, public/nikah.ics and public/fathima-amna-nirjas.ics (both) from config/event.json.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ev = JSON.parse(readFileSync(join(root, 'config/event.json'), 'utf8'));
const stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// RFC 5545: lines are folded at 75 octets
function fold(line) {
  const out = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > 74) { out.push(cur); cur = ' ' + ch; bytes = 1 + b; } else { cur += ch; bytes += b; }
  }
  out.push(cur);
  return out;
}

const site = process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || ev.siteUrl || '';
const defs = [
  { key: 'nikah', ...ev.nikah },
  { key: 'reception', title: ev.title, start: ev.start, durationMinutes: ev.durationMinutes, displayDay: ev.displayDay, displayDate: ev.displayDate, displayMonthYear: ev.displayMonthYear, displayTime: ev.displayTime, venue: ev.venue },
];

const vevent = (d) => {
  const startMs = Date.parse(d.start);
  if (Number.isNaN(startMs)) throw new Error(`config/event.json: bad start for ${d.key}: ${d.start}`);
  const endMs = startMs + d.durationMinutes * 60_000;
  const desc = [
    d.title,
    `${d.displayDay}, ${d.displayDate} ${d.displayMonthYear}, ${d.displayTime} ${ev.tzLabel}.`,
    d.venue.addressOneLine,
    'Kindly grace the occasion with your presence and duas.',
    site ? `Invitation: ${site}` : '',
  ].filter(Boolean).join('\n');
  return [
    'BEGIN:VEVENT',
    `UID:${d.key}-${ev.brideFull}-${ev.groomFull}-${stamp(startMs)}@invitation`.toLowerCase().replace(/\s+/g, '-'),
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(startMs)}`,
    `DTEND:${stamp(endMs)}`,
    `SUMMARY:${esc(d.title)}`,
    `LOCATION:${esc(d.venue.addressOneLine)}`,
    `DESCRIPTION:${esc(desc)}`,
    ...(site ? [`URL:${site}`] : []),
    'STATUS:CONFIRMED', 'TRANSP:OPAQUE',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(d.title)} is tomorrow`, 'TRIGGER:-P1D', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(d.title)} starts in 3 hours`, 'TRIGGER:-PT3H', 'END:VALARM',
    'END:VEVENT',
  ];
};

const wrap = (items) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...items.flatMap(vevent), 'END:VCALENDAR']
    .flatMap(fold).join('\r\n') + '\r\n';

mkdirSync(join(root, 'public'), { recursive: true });
for (const d of defs) writeFileSync(join(root, `public/${d.key}.ics`), wrap([d]));
writeFileSync(join(root, 'public/fathima-amna-nirjas.ics'), wrap(defs));
console.log(`ics: ${defs.map((d) => `${d.key} ${d.start}`).join(' | ')}`);

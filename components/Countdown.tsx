'use client';

import { useEffect, useRef, useState } from 'react';
import { startMs, endMs, names } from '../lib/event';
import { onceVisible } from '../lib/fx';

type Parts = { d: number; h: number; m: number; s: number };
type Left = Parts | 'now' | 'past' | null;
type Tone = 'ivory' | 'rose' | 'champagne' | 'wine';

function compute(): Left {
  const now = Date.now();
  if (now >= endMs) return 'past';
  if (now >= startMs) return 'now';
  const diff = startMs - now;
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

const A = '/countdown/';
// faint love-letter marks behind the numbers: [file, left cqw, top %, width cqw, rotation deg]
const MARKS: [string, number, number, number, number][] = [
  ['envelope', 9, 36, 22, -14], ['rings', 72, 34, 21, 10], ['heart', 6, 62, 15, -10],
  ['envelope', 70, 66, 22, 12], ['dove', 40, 70, 16, 0], ['spark', 45, 31, 6, 0], ['spark', 88, 52, 5, 0], ['spark', 8, 50, 5, 0],
];
const pad = (n: number) => String(n).padStart(2, '0');

/** Countdown: lace, roses and an outlined ribbon bow on a solid colour field (art in /public/countdown).
 *  Numbers are live text. `tone` switches the colourway; the lace and roses stay natural. */
export default function Countdown({ tone = 'ivory' }: { tone?: Tone }) {
  const [left, setLeft] = useState<Left>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    setLeft(compute());
    const id = setInterval(() => setLeft(compute()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    return onceVisible(el, () => el.classList.add('lcx--on'), 0.2);
  }, []);

  // the roses lean a touch toward the finger
  const move = (e: React.PointerEvent) => {
    const el = root.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
    el.style.setProperty('--my', String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
  };
  const rest = () => { const el = root.current; if (el) { el.style.setProperty('--mx', '0'); el.style.setProperty('--my', '0'); } };

  const p = left && left !== 'now' && left !== 'past' ? left : null;
  const units: [string, number][] = [['days', p ? p.d : 0], ['hours', p ? p.h : 0], ['minutes', p ? p.m : 0], ['seconds', p ? p.s : 0]];

  return (
    <>
      <section id="countdown" className={`lcx lcx--${tone}`} ref={root} aria-labelledby="lcx-h" onPointerMove={move} onPointerLeave={rest}>
        <div className="lcx__layer" aria-hidden="true">
          {MARKS.map(([n, x, y, w, r], i) => (
            <i key={i} className="lcx__mk" style={{ ['--m' as string]: `url(${A}m-${n}.webp)`, left: `${x}cqw`, top: `${y}%`, width: `${w}cqw`, height: `${w}cqw`, rotate: `${r}deg`, animationDelay: `-${i * 1.3}s` }} />
          ))}
        </div>

        <div className="lcx__lace lcx__lace--t" aria-hidden="true"><img src={`${A}lace1.webp`} alt="" loading="lazy" decoding="async" /></div>
        <div className="lcx__lace lcx__lace--b" aria-hidden="true"><img src={`${A}lace2.webp`} alt="" loading="lazy" decoding="async" /></div>
        <i className="lcx__rb lcx__rb--t" aria-hidden="true" />
        <i className="lcx__rb lcx__rb--b" aria-hidden="true" />
        {['tl', 'tr', 'bl', 'br'].map((c) => (
          <div key={c} className={`lcx__rose lcx__rose--${c}`} aria-hidden="true"><img src={`${A}corner.webp`} alt="" loading="lazy" decoding="async" /></div>
        ))}

        <div className="lcx__mid">
          <h2 id="lcx-h" className="lcx__ttl"><em>{names}</em>Until we gather</h2>
          {left === 'now' && <p className="lcx__msg">Alhamdulillah, the day is here.</p>}
          {left === 'past' && <p className="lcx__msg">Thank you for celebrating with us.</p>}
          {left !== 'now' && left !== 'past' && (
            <div className="lcx__row" role="timer" aria-label="Time until the wedding reception">
              {units.map(([lab, v]) => (
                <div className="lcx__u" key={lab}>
                  <b key={v}>{pad(v)}</b>
                  <span>{lab}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
'use client';

import { useEffect, useRef } from 'react';
import { goTo } from '../lib/nav';

/**
 * The wedding thread. A running EMBROIDERY STITCH runs down the gutter (echoing the names, which
 * are stitched out of petals) and is sewn further as you scroll — a needle-bead leads it, knots
 * light up at each section, and at the foot it TIES THE KNOT: a little love-knot draws itself in.
 * Its colour warms from rose at the top to violet at the foot. Pure SVG + scroll; no video.
 * Reduced motion: fully sewn and tied, still.
 */
const VB_H = 1000;
const NODES = [0.05, 0.26, 0.45, 0.63, 0.82]; // hero · photos · calendar · countdown · map
const PINS: { label: string; to: string | number }[] = [
  { label: 'Welcome', to: 0 }, { label: 'Photos', to: '#invitation' }, { label: 'Calendar', to: '#calendar' },
  { label: 'Countdown', to: '#countdown' }, { label: 'Location', to: '#map' },
];
const TIE = 0.97;                              // the footer: tie the knot

/** The sky behind the page: morning cream → blush → pale evening blue, by how far down you are. */
const SKY: [number, [number, number, number]][] = [
  [0, [252, 246, 239]], [0.45, [251, 239, 232]], [0.66, [247, 230, 225]], [0.8, [238, 229, 234]], [0.9, [226, 230, 238]], [1, [221, 232, 240]],
];
const skyAt = (p: number) => {
  for (let i = 1; i < SKY.length; i++) {
    if (p <= SKY[i][0]) {
      const [a, ca] = SKY[i - 1], [b, cb] = SKY[i], u = (p - a) / (b - a);
      return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * u)).join(',')})`;
    }
  }
  return `rgb(${SKY[SKY.length - 1][1].join(',')})`;
};

export default function ScrollThread() {
  const box = useRef<HTMLDivElement>(null);
  const reveal = useRef<SVGRectElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const tie = useRef<HTMLButtonElement>(null);
  const knots = useRef<(HTMLButtonElement | null)[]>([]);

  const d = (() => {
    let s = 'M7 0';
    for (let y = 0; y <= VB_H; y += 50) s += ` L${(7 + Math.sin(y / 132) * 2.4).toFixed(1)} ${y}`;
    return s;
  })();

  useEffect(() => {
    const el = box.current, rect = reveal.current, dot = tip.current, knot = tie.current;
    if (!el || !rect || !dot || !knot) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const posFor = (p: number) => {
      const w = el.clientWidth, h = el.clientHeight;
      return { x: ((7 + Math.sin((p * VB_H) / 132) * 2.4) / 14) * w, y: p * h };
    };
    const place = (node: HTMLElement, p: number) => {
      const { x, y } = posFor(p); node.style.left = `${x.toFixed(1)}px`; node.style.top = `${y.toFixed(1)}px`;
    };
    const relayout = () => { knots.current.forEach((k, i) => k && place(k, NODES[i])); place(knot, TIE); };
    relayout();

    const sky = (): void => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--sky', skyAt(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    const apply = (prog: number) => {
      const p = Math.max(0, Math.min(1, prog));
      rect.setAttribute('height', `${(p * VB_H).toFixed(1)}`);     // sew the stitch down to here
      place(dot, p);
      dot.style.opacity = p > 0.004 && p < TIE - 0.01 ? '1' : '0'; // the needle rests once the knot is tied
      let cur = -1;
      knots.current.forEach((k, i) => { if (!k) return; const on = p >= NODES[i] - 0.01; k.classList.toggle('thread__knot--on', on); if (on) cur = i; });
      knots.current.forEach((k, i) => k && k.classList.toggle('thread__knot--cur', i === cur));
      knot.classList.toggle('thread__tie--on', p >= TIE - 0.03);
    };

    if (reduced) { apply(1); dot.style.opacity = '0'; sky(); return; }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0; relayout(); sky();
        const max = document.documentElement.scrollHeight - window.innerHeight;
        apply(max > 0 ? (window.scrollY + window.innerHeight * 0.55) / (max + window.innerHeight * 0.55) : 0);
      });
    };
    apply(0.03); sky();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  return (
    <>
    <div className="sky" aria-hidden="true" />
    <div className="thread" ref={box} role="navigation" aria-label="Jump to a section">
      <svg className="thread__svg" aria-hidden="true" viewBox={`0 0 14 ${VB_H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="thgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dd90a4" />
            <stop offset="0.5" stopColor="#c99bb6" />
            <stop offset="1" stopColor="#b3a0d4" />
          </linearGradient>
          <clipPath id="thsew"><rect ref={reveal} x="-6" y="0" width="26" height="0" /></clipPath>
        </defs>
        <path className="thread__track" d={d} vectorEffect="non-scaling-stroke" />
        <path className="thread__line" d={d} vectorEffect="non-scaling-stroke" clipPath="url(#thsew)" />
      </svg>
      {NODES.map((_, i) => (
        <button key={i} type="button" className="thread__knot" ref={(el) => { knots.current[i] = el; }} aria-label={`Go to ${PINS[i].label}`}
          onClick={(e) => { const b = e.currentTarget; b.classList.add('thread__knot--tip'); setTimeout(() => b.classList.remove('thread__knot--tip'), 1700); goTo(PINS[i].to); }}>
          <i /><b>{PINS[i].label}</b>
        </button>
      ))}
      <button type="button" className="thread__tie" ref={tie} aria-label="Go to the end" onClick={() => goTo('#closing')}>
        <svg viewBox="0 0 26 20" aria-hidden="true">
          {/* a love-knot: two interlaced loops */}
          <path pathLength={1} d="M13 10 C13 2 3 2 3 10 C3 18 13 18 13 10 C13 2 23 2 23 10 C23 18 13 18 13 10 Z" />
        </svg>
      </button>
      <span className="thread__tip" ref={tip} />
    </div>
    </>
  );
}
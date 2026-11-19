'use client';

import { useEffect, useRef, useState } from 'react';
import { event } from '../lib/event';
import { goTo } from '../lib/nav';
import NameField from './NameField';

/* eslint-disable @next/next/no-img-element */

/**
 * Closing scene. The blue-hour beach stays exactly as it was; the names are petals; and the scene now
 * lives: a few small butterflies wander over the flower beds, land on the blooms and lift off when a
 * finger or cursor comes near; sunlight glitters on the sea, fireflies rise, blush petals drift, and a
 * quiet line says when we meet. No video, no WebGL. Reduced motion: butterflies rest, nothing drifts.
 */
const VW = 941, VH = 1672; // the photo's own pixel space, so the butterflies sit on its flowers

const PERCH = [
  [300, 872], [338, 948], [286, 1004], [664, 1032], [690, 1104], [372, 840],
  [190, 1318], [60, 1362], [120, 1512], [250, 1326], [90, 1250],
  [740, 1332], [832, 1402], [900, 1452], [850, 1560], [780, 1250],
];

const BF = [
  { hue: 'cream', s: 1.55 }, { hue: 'blush', s: 1.35 }, { hue: 'blue', s: 1.45 }, { hue: 'gold', s: 1.25 }, { hue: 'cream', s: 1.15 },
] as const;

function Butterfly({ hue }: { hue: string }) {
  const wing = (
    <>
      <path d="M0 -1C5 -17 20 -22 25 -11C28 -2 16 4 0 2Z" fill={`url(#bf-${hue})`} stroke="rgba(120,70,90,.3)" strokeWidth=".5" />
      <path d="M0 2C13 3 22 10 16 19C12 24 3 17 0 6Z" fill={`url(#bf-${hue})`} stroke="rgba(120,70,90,.3)" strokeWidth=".5" />
      <path d="M2 -1C9 -8 15 -10 20 -9M2 2C10 3 15 8 14 14M3 0C10 -2 17 -4 22 -5" fill="none" stroke="rgba(120,70,90,.2)" strokeWidth=".45" />
      <path d="M0 -1C5 -17 20 -22 25 -11" fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="17" cy="-9" r="2.2" fill="rgba(255,255,255,.6)" />
    </>
  );
  return (
    <>
      <g className="bw bw--l">{wing}</g>
      <g className="bw bw--r">{wing}</g>
      <ellipse cx="0" cy="3" rx="1.4" ry="9.5" fill="#6a4a52" />
      <circle cx="0" cy="-8" r="1.9" fill="#6a4a52" />
      <path d="M-.6 -9C-3 -15 -6 -16 -9 -14M.6 -9C3 -15 6 -16 9 -14" fill="none" stroke="#6a4a52" strokeWidth=".7" strokeLinecap="round" />
    </>
  );
}

export default function Closing() {
  const [month, year] = event.displayMonthYear.split(',').map((t) => t.trim());
  const root = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const bfs = useRef<(SVGGElement | null)[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = root.current, sv = svg.current; if (!el || !sv) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let visible = false, raf = 0, last = 0, started = false;

    type B = {
      g: SVGGElement; wl: SVGGElement; wr: SVGGElement; x: number; y: number; vx: number; vy: number; wx: number; wy: number; s: number;
      hold: number; ph: number; boost: number; heading: number; perch: boolean
    };
    const list: B[] = [];
    bfs.current.forEach((g, i) => {
      if (!g) return;
      list.push({
        g, wl: g.querySelector('.bw--l') as SVGGElement, wr: g.querySelector('.bw--r') as SVGGElement, s: BF[i].s,
        x: 160 + i * 150, y: 1100 + (i % 2) * 120, vx: 0, vy: 0, wx: 480, wy: 1000, hold: 0, ph: Math.random() * 6, boost: 0, heading: 0, perch: false
      });
    });
    const waypoint = (b: B) => {
      if (Math.random() < 0.6) { const p = PERCH[Math.floor(Math.random() * PERCH.length)]; b.wx = p[0]; b.wy = p[1]; b.perch = true; }
      else { b.perch = false; b.wx = 120 + Math.random() * 700; b.wy = 760 + Math.random() * 760; }
    };
    const draw = (b: B, f: number) => {
      b.g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.heading.toFixed(1)}) scale(${b.s})`);
      b.wr.setAttribute('transform', `scale(${f.toFixed(2)} 1)`); b.wl.setAttribute('transform', `scale(${(-f).toFixed(2)} 1)`);
    };
    list.forEach((b) => { waypoint(b); b.g.style.opacity = '1'; });

    const ptr = { x: -9999, y: -9999 };
    const toSvg = (e: PointerEvent) => {
      const m = sv.getScreenCTM(); if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); ptr.x = p.x; ptr.y = p.y;
    };
    const scatter = (R: number) => list.forEach((b) => {
      const dx = b.x - ptr.x, dy = b.y - ptr.y, d = Math.hypot(dx, dy);
      if (d < R) { const a = Math.atan2(dy, dx); b.hold = 0; b.perch = false; b.boost = 1.3; b.wx = Math.min(860, Math.max(80, b.x + Math.cos(a) * 340)); b.wy = Math.min(1560, Math.max(700, b.y + Math.sin(a) * 340 - 80)); }
    });
    const onMove = (e: PointerEvent) => { toSvg(e); scatter(130); };
    const onDown = (e: PointerEvent) => { toSvg(e); scatter(300); };

    const loop = (now: number) => {
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      list.forEach((b) => {
        b.ph += dt * (b.hold > 0 ? 3 : 18 + b.boost * 6);
        if (b.boost > 0) b.boost = Math.max(0, b.boost - dt);
        if (b.hold > 0) {
          b.hold -= dt; b.heading += (0 - b.heading) * Math.min(1, dt * 4);
          draw(b, 0.55 + 0.45 * Math.sin(b.ph));
          if (b.hold <= 0) waypoint(b);
          return;
        }
        const dx = b.wx - b.x, dy = b.wy - b.y, d = Math.hypot(dx, dy) || 1;
        const sp = (88 + (b.s - 1.1) * 40) * (1 + b.boost * 0.9);
        const tx = (dx / d) * sp, ty = (dy / d) * sp + Math.sin(b.ph * 0.3) * 30;
        b.vx += (tx - b.vx) * Math.min(1, dt * 2); b.vy += (ty - b.vy) * Math.min(1, dt * 2);
        b.x += b.vx * dt; b.y += b.vy * dt;
        const th = (Math.atan2(b.vy, b.vx) * 180) / Math.PI + 90;
        let dh = th - b.heading; dh = ((dh + 540) % 360) - 180; b.heading += dh * Math.min(1, dt * 5);
        if (d < 18) { if (b.perch) { b.hold = 3 + Math.random() * 4; b.vx = b.vy = 0; } else waypoint(b); }
        draw(b, 0.22 + 0.78 * Math.abs(Math.sin(b.ph)));
      });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !started) {
        started = true; setActive(true); el.classList.add('cf--on');
        if (reduced) list.forEach((b, i) => { const p = PERCH[(i * 3) % PERCH.length]; b.x = p[0]; b.y = p[1]; b.heading = 0; draw(b, 0.9); });
      }
      if (visible && !reduced && !raf) { last = 0; raf = requestAnimationFrame(loop); }
    }, { threshold: 0.2 });
    io.observe(el);

    const frame = el.querySelector('.cf__frame') as HTMLElement | null;
    if (!reduced) { frame?.addEventListener('pointermove', onMove); frame?.addEventListener('pointerdown', onDown); }
    return () => { io.disconnect(); cancelAnimationFrame(raf); frame?.removeEventListener('pointermove', onMove); frame?.removeEventListener('pointerdown', onDown); };
  }, []);

  return (
    <footer ref={root} className="cf" aria-label="Closing">
      <div className="cf__frame">
        <div className="cf__zoom">
          <img className="cf__bg" src="/media/footer-scene.webp" alt="A couple under a flower arch by the sea at dusk" width={941} height={1672} loading="lazy" decoding="async" />
          <svg ref={svg} className="cf__bfs" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="bf-cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fffdf8" /><stop offset=".65" stopColor="#f6e6d4" /><stop offset="1" stopColor="#f2cfc0" /></linearGradient>
              <linearGradient id="bf-blush" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde8ec" /><stop offset=".6" stopColor="#f0a6b8" /><stop offset="1" stopColor="#fbd9c8" /></linearGradient>
              <linearGradient id="bf-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eef5fc" /><stop offset=".6" stopColor="#a9c4e6" /><stop offset="1" stopColor="#d9e4f4" /></linearGradient>
              <linearGradient id="bf-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6d6" /><stop offset=".6" stopColor="#efc77e" /><stop offset="1" stopColor="#f6c4a4" /></linearGradient>
            </defs>
            {BF.map((b, i) => (
              <g key={i} className="bf" ref={(n) => { bfs.current[i] = n; }} style={{ opacity: 0 }}><Butterfly hue={b.hue} /></g>
            ))}
          </svg>
        </div>
        <div className="cf__veil" aria-hidden="true" />
        <div className="cf__glint" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}
        </div>
        <div className="cf__petals" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ ['--d' as string]: i }} />)}
        </div>
        <div className="cf__flies" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ ['--i' as string]: i }} />)}
        </div>
        <h2 className="cf__names" aria-label={`${event.brideFull} and ${event.groomFull}`}>
          <span className="sr-only">{event.brideFull} and {event.groomFull}</span>
          <NameField names={[event.bride, event.groom]} active={active} tone="bloom" />
        </h2>
        <div className="cf__end">
          <p className="cf__see">See you on</p>
          <p className="cf__date">{event.displayDate} {month}</p>
          <svg className="cf__swash" viewBox="0 0 160 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true"><path d="M4 8C32 2 56 12 80 7C104 2 124 11 156 6" /><circle cx="80" cy="7.5" r="1.8" fill="currentColor" stroke="none" /></svg>
          <p className="cf__sub">{year} · {event.displayDay} · {event.displayTime}</p>
          <button type="button" className="cf__top" onClick={() => goTo(0)}>
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 7.5 6 4l3.5 3.5" /></svg>
            <span>Back to the top</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
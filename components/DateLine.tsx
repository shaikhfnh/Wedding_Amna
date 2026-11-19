'use client';

import { useEffect, useRef } from 'react';
import { event } from '../lib/event';

/* The date, hung on a washing line like photographs left to dry.
 * Everything swings all the time on a slow pendulum with a little wind, the page scroll gives it a push,
 * and every card can be grabbed: pull gently and it swings, pull hard and the peg pops, the card falls,
 * bounces and lies on the ground, can be picked up and thrown, and finally floats back to its peg. */

type Mode = 'hang' | 'drag' | 'free' | 'fdrag' | 'return';
type Kind = 'photo' | 'date' | 'venue';
interface Def { id: string; big?: boolean; kind: Kind; row: 0 | 1; fx: number; img?: string; alt?: string; cap?: string; tilt: number; ar?: number }
interface Card {
  def: Def; el: HTMLElement; w: number; h: number; L: number;
  mode: Mode; th: number; om: number; ext: number; extv: number; tension: number;
  po: { x: number; y: number; vx: number; vy: number };
  x: number; y: number; vx: number; vy: number; ph: number; vph: number; rest: number; restTilt: number;
  gx: number; gy: number; r0: number; moved: number; pid: number; lastT: number; lastX: number; lastY: number; lastTh: number;
  p1: number; p2: number; enterAt: number; entered: boolean;
  fx: number; fxT: number;
}

const DEFS: Def[] = [
  { id: 'a', kind: 'photo', row: 0, fx: 0.86, img: '/media/mem-swans.jpg', alt: 'Two swans on a garden pond', tilt: 0.06, ar: 4 / 3 },
  { id: 'b', big: true, kind: 'photo', row: 0, fx: 0.5, img: '/media/mem-garden.jpg', alt: 'A garden pavilion by the water at sunset', tilt: 0.02, ar: 1.32 },
  { id: 'c', kind: 'photo', row: 0, fx: 0.14, img: '/media/mem-lantern.jpg', alt: 'A lantern among roses', tilt: -0.07, ar: 4 / 3 },
  { id: 'd', kind: 'date', row: 1, fx: 0.3, tilt: 0.02 },
  { id: 'e', kind: 'venue', row: 1, fx: 0.76, tilt: -0.04 },
];

/* rain behind the cards: fixed numbers, so server and browser render the same thing */
const RAIN = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 37 + 7) % 100, d: ((i * 0.37) % 2.6).toFixed(2), t: (1.1 + (i % 5) * 0.22).toFixed(2), l: 16 + (i % 4) * 8,
}));

const G_HANG = 170, G_FALL = 2600, DAMP = 1.15;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

export default function DateLine() {
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const strA = useRef<SVGPathElement>(null);
  const strB = useRef<SVGPathElement>(null);
  const loose = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const wrap = root.current, area = box.current;
    if (!wrap || !area) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(area.querySelectorAll<HTMLElement>('[data-c]'));
    const cards: Card[] = els.map((el, i) => ({
      def: DEFS[i], el, w: 100, h: 130, L: 60, mode: 'hang', th: DEFS[i].tilt, om: 0, ext: 0, extv: 0, tension: 0,
      po: { x: 0, y: 0, vx: 0, vy: 0 }, x: 0, y: 0, vx: 0, vy: 0, ph: 0, vph: 0, rest: 0, restTilt: 0,
      gx: 0, gy: 0, r0: 60, moved: 0, pid: -1, lastT: 0, lastX: 0, lastY: 0, lastTh: 0,
      p1: Math.random() * 6.28, p2: Math.random() * 6.28, enterAt: 0, entered: false,
      fx: DEFS[i].fx, fxT: DEFS[i].fx,
    }));
    // the order along each string; dropping a card on another reorders it
    const orders: number[][] = [0, 1].map((r) => cards.map((_, i) => i).filter((i) => DEFS[i].row === r).sort((a, b) => DEFS[a].fx - DEFS[b].fx));
    let placed = false;
    const place = () => {
      orders.forEach((o) => {
        const sum = o.reduce((s, i) => s + cards[i].w, 0), g = (W - 40 - sum) / (o.length + 1);
        let x = 20 + g;
        o.forEach((i) => { cards[i].fxT = (x + cards[i].w / 2) / W; x += cards[i].w + g; });
      });
      if (!placed) { cards.forEach((c) => { c.fx = c.fxT; }); placed = true; }
    };

    let W = 360, H = 520;
    const y0 = [34, 0], sag = [16, 22];
    const baseY = (row: number, x: number) => y0[row] + sag[row] * 4 * (x / W) * (1 - x / W);

    const layout = () => {
      W = area.clientWidth;
      // small phones get noticeably smaller cards so the line stays airy
      const sm = W < 420 ? clamp(0.8 + (W - 320) * 0.0017, 0.78, 0.92) : 1;
      const pw = clamp(W * 0.5 * sm, 150, 250), ps = clamp(W * 0.22 * sm, 74, 112);
      const dw = clamp(W * 0.44 * sm, 124, 250), vw = clamp(W * 0.31 * sm, 94, 180);
      let rowAbottom = 0;
      cards.forEach((c) => {
        const k = c.def.kind;
        c.w = k === 'photo' ? (c.def.big ? pw : ps) : k === 'date' ? dw : vw;
        c.h = k === 'photo' ? (c.w - 14) * (c.def.ar ?? 1) + (c.def.big ? 34 : 40) : k === 'date' ? dw * 1.12 : vw * 1.2;
        c.L = c.h / 2 - 6;
        c.el.style.width = c.w + 'px';
        c.el.style.height = c.h + 'px';
        c.el.style.setProperty('--w', c.w + 'px');
        c.el.style.setProperty('--ar', String(c.def.ar ?? 1));
      });
      cards.forEach((c) => { if (c.def.row === 0) rowAbottom = Math.max(rowAbottom, y0[0] + sag[0] + c.h + 6); });
      y0[1] = rowAbottom + 54;
      const rowBh = Math.max(...cards.filter((c) => c.def.row === 1).map((c) => c.h));
      H = y0[1] + sag[1] + rowBh + 70;
      place();
      area.style.height = H + 'px';
      area.style.setProperty('--H', H + 'px');
      area.classList.add('dl--live');
    };

    const pivot = (c: Card) => {
      const x = c.fx * W;
      return { x: x + c.po.x, y: baseY(c.def.row, x) + 3 + c.po.y };
    };
    const hangCenter = (c: Card) => { const p = pivot(c); return { x: p.x, y: p.y + c.L }; };

    const render = (c: Card, t: number) => {
      const e = c.entered ? 1 : ease((t - c.enterAt) / 0.9);
      if (c.mode === 'hang' || c.mode === 'drag') {
        const p = pivot(c);
        const jit = c.tension > 0.5 ? Math.sin(t * 75) * 0.03 * (c.tension - 0.5) * 2 : 0;
        c.el.style.transform = `translate(${p.x - c.w / 2}px,${p.y - 6 - (1 - e) * 110}px) rotate(${c.th + jit}rad) translateY(${c.ext}px)`;
      } else {
        c.el.style.transform = `translate(${c.x - c.w / 2}px,${c.y - c.h / 2}px) rotate(${c.ph}rad)`;
      }
      c.el.style.opacity = String(e);
    };

    const setOrigin = (c: Card) => {
      c.el.style.transformOrigin = c.mode === 'hang' || c.mode === 'drag' ? `${c.w / 2}px 6px` : '50% 50%';
    };

    const petals = (x: number, y: number) => {
      if (reduced) return;
      const col = ['#f1b3c1', '#e58ca2', '#f5c8d2', '#fffaf3'];
      for (let i = 0; i < 9; i++) {
        const s = document.createElement('i');
        s.className = 'dl__petal';
        s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.background = col[i % 4];
        area.appendChild(s);
        const a = Math.random() * 6.28, r = 24 + Math.random() * 50;
        s.animate([
          { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r - 18}px)) rotate(${i * 40}deg) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * r * 1.2}px),calc(-50% + ${Math.sin(a) * r + 60}px)) rotate(${i * 90}deg) scale(.5)`, opacity: 0 },
        ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.2,1)' }).finished.then(() => s.remove(), () => s.remove());
      }
    };

    const refreshLoose = () => {
      const any = cards.some((c) => c.mode !== 'hang' && c.mode !== 'drag');
      area.classList.toggle('dl--loose', any);
    };

    let hl: Card | null = null;
    const dropTarget = (c: Card) => {
      let best: Card | null = null, bd = 1e9;
      cards.forEach((b) => {
        if (b === c || b.def.row !== c.def.row || b.mode !== 'hang') return;
        const p = pivot(b), dx = Math.abs(c.x - p.x), dy = Math.abs(c.y - (p.y + b.L));
        if (dx < b.w * 0.6 && dy < b.h * 0.6 && dx < bd) { best = b; bd = dx; }
      });
      return best;
    };
    const mark = (b: Card | null) => {
      if (b === hl) return;
      hl?.el.classList.remove('dl__c--target');
      b?.el.classList.add('dl__c--target');
      hl = b;
    };
    const reorder = (c: Card, to: Card) => {
      const o = orders[c.def.row], from = o.indexOf(cards.indexOf(c)), at = o.indexOf(cards.indexOf(to));
      o.splice(from, 1);
      o.splice(from < at ? at : at, 0, cards.indexOf(c));
      place();
    };

    const toFree = (c: Card, vx: number, vy: number) => {
      c.mode = 'free'; c.vx = vx; c.vy = vy; c.vph = clamp(vx * 0.004, -3, 3); c.rest = 0;
      c.restTilt = (Math.random() - 0.5) * 0.22; setOrigin(c); refreshLoose();
    };

    /* ---------- physics ---------- */
    const step = (dt: number, t: number) => {
      // neighbours on the same string drag each other along
      cards.forEach((a, i) => {
        if (a.mode !== 'hang') return;
        [i - 1, i + 1].forEach((j) => {
          const b = cards[j];
          if (b && b.def.row === a.def.row && b.mode === 'hang') a.om += (b.th - a.th) * 1.1 * dt;
        });
      });
      cards.forEach((c, i) => {
        if (c.fx !== c.fxT) { c.fx += (c.fxT - c.fx) * Math.min(1, 7 * dt); if (Math.abs(c.fxT - c.fx) < 0.0003) c.fx = c.fxT; }
        if (!c.entered && t - c.enterAt > 0.9 && t >= c.enterAt) { c.entered = true; c.om += (i % 2 ? -1 : 1) * (c.L > 150 ? 0.18 : 0.35); }

        // string pull springs back
        if (c.mode !== 'drag') {
          c.po.vx += (-110 * c.po.x - 11 * c.po.vx) * dt; c.po.vy += (-110 * c.po.y - 11 * c.po.vy) * dt;
          c.po.x += c.po.vx * dt; c.po.y += c.po.vy * dt;
        }

        if (c.mode === 'hang') {
          // a big card is heavy: it hangs shorter and the wind moves it less
          const big = c.L > 150, Le = Math.min(c.L, 95);
          const wind = (big ? 0.05 : 0.16) * (Math.sin(t * 0.55 + c.p1) + 0.6 * Math.sin(t * 0.91 + c.p2));
          const a = -(G_HANG / (Le * 1.15)) * Math.sin(c.th - c.def.tilt * 0.4) - (big ? 1.8 : DAMP) * c.om + wind;
          c.om += a * dt; c.th += c.om * dt;
          c.th = clamp(c.th, -1.1, 1.1); c.om = clamp(c.om, -3.2, 3.2);
          c.extv += (-70 * c.ext - 9 * c.extv) * dt; c.ext += c.extv * dt;
          c.tension *= 0.9;
        } else if (c.mode === 'free') {
          c.vy += G_FALL * dt; c.vx *= 1 - 0.25 * dt;
          c.x += c.vx * dt; c.y += c.vy * dt; c.ph += c.vph * dt; c.vph *= 1 - 0.8 * dt;
          const hx = Math.abs(c.w / 2 * Math.cos(c.ph)) + Math.abs(c.h / 2 * Math.sin(c.ph));
          const hy = Math.abs(c.h / 2 * Math.cos(c.ph)) + Math.abs(c.w / 2 * Math.sin(c.ph));
          if (c.x - hx < 0) { c.x = hx; c.vx = -c.vx * 0.4; }
          if (c.x + hx > W) { c.x = W - hx; c.vx = -c.vx * 0.4; }
          const floor = H - 10;
          let onFloor = false;
          if (c.y + hy > floor) {
            c.y = floor - hy; onFloor = true;
            if (c.vy > 220) { c.vy = -c.vy * 0.3; c.vph += clamp(c.vx * 0.003, -2, 2) + (Math.random() - 0.5) * 1.2; } else c.vy = 0;
            c.vx *= 1 - Math.min(1, 7 * dt); c.vph *= 1 - Math.min(1, 6 * dt);
            c.ph += (c.restTilt - c.ph) * (1 - Math.exp(-6 * dt));
          }
          if (c.y - hy < -240) { c.y = hy - 240; c.vy = Math.abs(c.vy) * 0.3; }
          if (onFloor && Math.abs(c.vx) < 10 && Math.abs(c.vy) < 10) c.rest += dt; else c.rest = 0;
          if (c.rest > 3.4) { c.mode = 'return'; setOrigin(c); }
        } else if (c.mode === 'return') {
          const T = hangCenter(c), k = 75, d = 17;
          c.vx += (k * (T.x - c.x) - d * c.vx) * dt; c.vy += (k * (T.y - c.y) - d * c.vy) * dt;
          c.vph += (k * (c.def.tilt - c.ph) - d * c.vph) * dt;
          c.x += c.vx * dt; c.y += c.vy * dt; c.ph += c.vph * dt;
          if (Math.hypot(T.x - c.x, T.y - c.y) < 3 && Math.hypot(c.vx, c.vy) < 14) {
            c.mode = 'hang'; c.th = c.ph; c.om = c.vx * 0.004 + (Math.random() - 0.5) * 1.5; c.ext = 0; c.extv = 0; setOrigin(c); refreshLoose();
          }
        } else if (c.mode === 'fdrag') {
          c.ph += (clamp(c.vx * 0.0007, -0.45, 0.45) - c.ph) * Math.min(1, 8 * dt);
        }
        render(c, t);
      });
      // the two strings follow the cards that tug them
      [strA.current, strB.current].forEach((path, row) => {
        if (!path) return;
        const N = 30; let d = '';
        for (let i = 0; i <= N; i++) {
          const x = -6 + (W + 12) * i / N;
          let y = baseY(row, clamp(x, 0, W)) + Math.sin(t * 0.7 + x * 0.012 + row) * 1.2;
          cards.forEach((c) => {
            if (c.def.row !== row) return;
            const cx = c.fx * W, g = Math.exp(-Math.pow((x - cx) / (W * 0.13), 2));
            y += c.po.y * g;
          });
          d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        }
        path.setAttribute('d', d);
      });
    };

    /* ---------- pointer ---------- */
    const toLocal = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const find = (el: EventTarget | null) => cards.find((c) => c.el === el || c.el.contains(el as Node));
    const front = (c: Card) => { cards.forEach((k) => { k.el.style.zIndex = k === c ? '20' : '1'; }); };

    const down = (e: PointerEvent) => {
      if (reduced) return;
      const c = find(e.currentTarget);
      if (!c) return;
      const p = toLocal(e);
      c.pid = e.pointerId; c.moved = 0; c.lastT = performance.now(); c.lastX = p.x; c.lastY = p.y; c.lastTh = c.th;
      c.el.setPointerCapture(e.pointerId);
      c.el.classList.add('dl__c--held');
      front(c);
      if (c.mode === 'hang') {
        const pv = pivot(c);
        c.mode = 'drag'; c.r0 = Math.max(46, Math.hypot(p.x - pv.x, p.y - pv.y));
        setOrigin(c);
      } else {
        c.mode = 'fdrag'; c.gx = p.x - c.x; c.gy = p.y - c.y; c.vx = 0; c.vy = 0; c.rest = 0; setOrigin(c);
        refreshLoose();
      }
    };
    const move = (e: PointerEvent) => {
      const c = find(e.currentTarget);
      if (!c || c.pid !== e.pointerId) return;
      const p = toLocal(e), now = performance.now(), dt = Math.max(0.008, (now - c.lastT) / 1000);
      if (c.mode === 'drag') {
        const pv = pivot(c);
        const vx = p.x - (pv.x - c.po.x), vy = p.y - (pv.y - c.po.y);
        const d = Math.hypot(vx, vy);
        const s = Math.max(0, d - c.r0);
        const target = clamp(Math.atan2(-vx, Math.max(8, vy)), -1.45, 1.45);
        const old = c.th;
        c.th += (target - c.th) * 0.55;
        c.om = c.om * 0.6 + ((c.th - old) / dt) * 0.4;
        c.ext = s * 0.4;
        c.tension = clamp(s / 70, 0, 1);
        const k = Math.min(16, s * 0.22) / Math.max(1, d);
        c.po.x = vx * k; c.po.y = Math.max(0, vy) * k; c.po.vx = 0; c.po.vy = 0;
        c.moved += Math.hypot(p.x - c.lastX, p.y - c.lastY);
        if (s > 70) {
          // the peg pops
          const cc = { x: pv.x - Math.sin(c.th) * (c.L + c.ext), y: pv.y + Math.cos(c.th) * (c.L + c.ext) };
          petals(pv.x, pv.y);
          c.mode = 'fdrag'; c.x = cc.x; c.y = cc.y; c.ph = c.th; c.gx = p.x - cc.x; c.gy = p.y - cc.y; c.vx = 0; c.vy = 0; c.tension = 0; c.ext = 0; c.extv = 0;
          setOrigin(c); refreshLoose();
          c.el.classList.add('dl__c--loose');
        }
      } else if (c.mode === 'fdrag') {
        const nx = p.x - c.gx, ny = p.y - c.gy;
        c.vx = c.vx * 0.5 + ((nx - c.x) / dt) * 0.5; c.vy = c.vy * 0.5 + ((ny - c.y) / dt) * 0.5;
        c.x += (nx - c.x) * 0.7; c.y += (ny - c.y) * 0.7;
        c.moved += Math.hypot(p.x - c.lastX, p.y - c.lastY);
        mark(dropTarget(c));
      }
      c.lastT = now; c.lastX = p.x; c.lastY = p.y;
    };
    const up = (e: PointerEvent) => {
      const c = find(e.currentTarget);
      if (!c || c.pid !== e.pointerId) return;
      c.pid = -1; c.el.classList.remove('dl__c--held');
      if (c.mode === 'drag') {
        c.mode = 'hang'; setOrigin(c);
        c.om = clamp(c.om, -9, 9);
        if (c.moved < 5) {
          c.om += (c.th >= 0 ? -1 : 1) * (c.L > 150 ? 0.6 : 2);   // a tap gives it a push
          const pv = pivot(c);
          petals(pv.x - Math.sin(c.th) * c.L, pv.y + Math.cos(c.th) * c.L * 0.8);
        }
        c.po.vx = 0; c.po.vy = 0;
      } else if (c.mode === 'fdrag') {
        const tgt = dropTarget(c);
        mark(null);
        if (tgt) {
          petals(c.x, c.y - c.h * 0.3);
          reorder(c, tgt);
          c.mode = 'return'; setOrigin(c); refreshLoose();
          return;
        }
        const T = hangCenter(c);
        if (Math.hypot(T.x - c.x, T.y - c.y) < 80) { c.mode = 'return'; setOrigin(c); }
        else toFree(c, clamp(c.vx, -2600, 2600), clamp(c.vy, -2600, 2600));
        if (c.mode === 'return') refreshLoose();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const c = find(e.currentTarget);
      if (c && c.mode === 'hang') c.om += 2.6;
    };
    els.forEach((el) => {
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('keydown', key);
    });
    // a mouse brushed across the line sets the cards swaying
    let bx = 0, bt = 0;
    const brush = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reduced) return;
      const p = toLocal(e), now = performance.now(), dt = Math.max(8, now - bt) / 1000, vx = (p.x - bx) / dt;
      bx = p.x; bt = now;
      cards.forEach((c) => {
        if (c.mode !== 'hang') return;
        const pv = pivot(c);
        if (Math.abs(p.x - pv.x) < c.w / 2 + 6 && p.y > pv.y - 10 && p.y < pv.y + c.h) c.om += clamp(vx, -1400, 1400) * 0.0006;
      });
    };
    area.addEventListener('pointermove', brush);
    const hangBack = () => { cards.forEach((c) => { if (c.mode === 'free') { c.mode = 'return'; setOrigin(c); } }); };
    const btn = loose.current;
    btn?.addEventListener('click', hangBack);

    /* ---------- scroll gives everything a push ---------- */
    let lastY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastY; lastY = window.scrollY;
      if (!visible || Math.abs(dy) < 1) return;
      cards.forEach((c, i) => { if (c.mode === 'hang') c.om += clamp(dy, -50, 50) * 0.0012 * (0.7 + 0.3 * Math.sin(i * 2.1)) * (c.L > 150 ? 0.3 : 1); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- loop ---------- */
    let raf = 0, last = 0, visible = false, started = false;
    const loop = (now: number) => {
      const t = now / 1000, dt = Math.min(0.033, last ? t - last : 0.016); last = t;
      // sub-steps keep the springs stable
      step(dt / 2, t); step(dt / 2, t);
      raf = requestAnimationFrame(loop);
    };
    const begin = () => {
      if (started) return;
      started = true;
      const t = performance.now() / 1000;
      cards.forEach((c, i) => { c.enterAt = t + 0.15 + i * 0.2; });
      wrap.classList.add('dl--on');
    };

    layout();
    cards.forEach((c) => { setOrigin(c); c.th = c.def.tilt; });
    if (reduced) {
      cards.forEach((c) => { c.entered = true; render(c, 0); });
      step(0, 0);
      wrap.classList.add('dl--on');
    }
    const ro = new ResizeObserver(() => { layout(); if (reduced) { step(0, 0); } });
    ro.observe(area);
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) { begin(); if (!reduced && !raf) { last = 0; raf = requestAnimationFrame(loop); } }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.12 });
    io.observe(wrap);
    // a small invitation to play, once
    const hint = window.setTimeout(() => { const c = cards[1]; if (c.mode === 'hang') c.om += c.L > 150 ? 0.3 : 2.4; }, 3600);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); clearTimeout(hint);
      window.removeEventListener('scroll', onScroll);
      els.forEach((el) => {
        el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('keydown', key);
      });
      btn?.removeEventListener('click', hangBack);
      area.removeEventListener('pointermove', brush);
    };
  }, []);

  return (
    <section ref={root} id="invitation" className="dl" aria-labelledby="dl-h">
      <p className="dl__eyebrow">Save the date</p>
      <h2 id="dl-h" className="dl__title">A day to remember</h2>

      <div ref={box} className="dl__area" role="group" aria-label="Photographs and details of the day, hung on a line. Drag any of them to make it swing.">
        <div className="dl__rain" aria-hidden="true">
          {RAIN.map((r, i) => (
            <i key={i} style={{ ['--x' as string]: `${r.x}%`, ['--d' as string]: `${r.d}s`, ['--t' as string]: `${r.t}s`, ['--l' as string]: `${r.l}px` }} />
          ))}
        </div>
        <svg className="dl__svg" aria-hidden="true">
          <path ref={strA} className="dl__string" />
          <path ref={strB} className="dl__string" />
        </svg>

        {DEFS.map((d) => (
          <div key={d.id} data-c className={`dl__c dl__c--${d.kind}${d.big ? ' dl__c--big' : ''}`} tabIndex={0}
            style={{ ['--dly' as string]: `${0.5 + DEFS.indexOf(d) * 0.35}s` }}>
            <span className="dl__peg" aria-hidden="true" />
            {d.kind === 'photo' && (
              <>
                <div className="dl__ph">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.img} alt={d.alt} width={900} height={Math.round(900 * (d.ar ?? 1))} draggable={false} />
                  <span className="dl__fog" aria-hidden="true" />
                </div>
                {d.cap && <span className="dl__cap">{d.cap}</span>}
              </>
            )}
            {d.kind === 'date' && (
              <div className="dl__date" aria-label={`${event.displayDay}, ${event.displayDate} ${event.displayMonthYear}, ${event.displayTime}`}>
                <small>{event.displayDay}</small>
                <b>{event.displayDate}</b>
                <span>{event.displayMonthYear.replace(',', '')}</span>
                <svg viewBox="0 0 100 96" aria-hidden="true"><path d="M50 88 C18 62 6 44 6 29 C6 15 17 7 28 7 C38 7 46 13 50 21 C54 13 62 7 72 7 C83 7 94 15 94 29 C94 44 82 62 50 88 Z" /></svg>
                <em>{event.displayTime} {event.tzLabel}</em>
              </div>
            )}
            {d.kind === 'venue' && (
              <div className="dl__venue">
                <small>The Reception</small>
                <strong>{event.venue.line1.replace(/,$/, '')}</strong>
                <span>{event.venue.line2.replace(/\.$/, '')}</span>
              </div>
            )}
          </div>
        ))}
        <button ref={loose} type="button" className="dl__back">Hang them back</button>
      </div>

      <p className="dl__hint">Pull one off. Drop it on another to swap.</p>
      <p className="sr-only">{event.displayDay}, {event.displayDate} {event.displayMonthYear} at {event.displayTime} {event.tzLabel}. {event.venue.addressOneLine}.</p>
    </section>
  );
}
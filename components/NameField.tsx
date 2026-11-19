'use client';

import { useEffect, useRef } from 'react';

/**
 * The two names, written out of rose petals, leaves and tiny stitches of thread.
 * - On load they drift down and gather, left to right, as if being embroidered.
 * - Hover or touch a letter: that whole letter lifts away like a puff of petals, its neighbours only half,
 *   and everything else stays put. When the hand moves on, the petals float back and re-form.
 * - A soft gust sweeps through every few seconds so phones show the magic without touching.
 * Reduced motion: drawn once, fully assembled, no movement.
 */
type P = {
  hx: number; hy: number; x: number; y: number; vx: number; vy: number;
  s: number; rot: number; vr: number; spr: number; ph: number; delay: number; free: number; a: number; ta: number; sens: number;
  letter: number; r0: number; lyr?: number;
};
type Spr = { c: HTMLCanvasElement; w: number; h: number };
type Letter = { id: number; line: number; idx: number; x0: number; x1: number; y0: number; y1: number; cx: number; cy: number };

const PEACH = {
  deep: ['#b06a34', '#bd7a40', '#a25f2c', '#c78a4c', '#b57338'],
  mid: ['#d79f58', '#e2b06a'],
  light: ['#f6dfae', '#fbe9c6'],
  thread: ['#9c7a38', '#b48f46'],
};
const DEEP = ['#c24763', '#cf5873', '#b83d5a', '#d4607a', '#c9506c'];
const MID = ['#df7f97', '#e58ca2'];
const LIGHT = ['#f1b3c1', '#f5c8d2'];
const THREAD = ['#a8465e', '#b95a72'];
const LEAF = ['#8da179', '#a0b48c'];
// violet flowers with beige highlights, for the footer
const VIOLET = {
  deep: ['#6f4a9c', '#7e57ab', '#64408f', '#8a64b8', '#734e9e'],
  mid: ['#9a7cc4', '#a98fcf'],
  light: ['#e9ddc4', '#f1e8d6'],
  thread: ['#8f7fa0', '#a08fae'],
};
const LEAF_BEIGE = ['#cabf9f', '#d7cdb0'];


/* ---- bloom: the names written in real-looking roses, small blossoms and veined leaves ---- */
type Rose = { base: string; mid: string; hi: string; deep: string };
const ROSE_BASES = ['#ff9db5', '#ffe6ee', '#ffc0cf', '#f2668a'];   // rose glow: luminous rose, petal pink, white-pink, deeper rose
const BLOSSOMS = ['#a98be0', '#ffffff', '#ffb3c8'];
const mixc = (a: string, b: string, t: number) => {
  const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')';
};
const ROSES: Rose[] = ROSE_BASES.map((b) => ({ base: b, mid: mixc(b, '#ffffff', 0.45), hi: mixc(b, '#ffffff', 0.85), deep: mixc(b, '#6a2a3a', 0.45) }));

function petalPath(x: CanvasRenderingContext2D, w: number, l: number) {
  x.beginPath(); x.moveTo(-w, 0);
  x.bezierCurveTo(-w * 1.15, -l * 0.62, -w * 0.55, -l * 1.02, 0, -l * 0.94);
  x.bezierCurveTo(w * 0.55, -l * 1.02, w * 1.15, -l * 0.62, w, 0);
  x.bezierCurveTo(w * 0.6, l * 0.2, -w * 0.6, l * 0.2, -w, 0); x.closePath();
}
function roseSprite(r: Rose): Spr {
  const S = 144, c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d')!; x.translate(S / 2, S / 2);
  // contact shadow so the head sits on the others
  const sh = x.createRadialGradient(0, 3, 6, 0, 3, 66); sh.addColorStop(0, 'rgba(60,25,35,.22)'); sh.addColorStop(1, 'rgba(60,20,30,0)');
  x.fillStyle = sh; x.beginPath(); x.arc(0, 3, 66, 0, 6.3); x.fill();
  const ring = (n: number, off: number, d: number, w: number, l: number, darken: number) => {
    for (let i = 0; i < n; i++) {
      const a = off + (i / n) * 6.2832 + (Math.sin(i * 7.3 + n) * 0.1);
      x.save(); x.rotate(a); x.translate(0, -d);
      const g = x.createLinearGradient(0, 0, 0, -l);
      g.addColorStop(0, r.deep); g.addColorStop(0.28, r.base); g.addColorStop(0.78, r.mid); g.addColorStop(1, r.hi);
      petalPath(x, w, l); x.fillStyle = g; x.fill();
      x.globalAlpha = darken; x.fillStyle = r.deep; x.fill(); x.globalAlpha = 1;
      x.lineWidth = 1.1; x.strokeStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.moveTo(-w * 0.78, -l * 0.74); x.bezierCurveTo(-w * 0.5, -l * 0.98, w * 0.5, -l * 0.98, w * 0.78, -l * 0.74); x.stroke();
      x.lineWidth = 0.9; x.strokeStyle = 'rgba(120,60,70,.24)'; petalPath(x, w, l); x.stroke();
      x.restore();
    }
  };
  ring(7, 0.2, 18, 25, 52, 0.18);
  ring(6, 0.7, 12, 19, 40, 0.14);
  ring(5, 0.1, 7, 14, 29, 0.1);
  ring(4, 0.9, 3, 10, 20, 0.04);
  // the tight spiral heart
  x.lineCap = 'round'; x.strokeStyle = 'rgba(' + (r.deep === '#ae6379' ? '60,10,25' : '130,55,65') + ',.55)';
  x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, 8, 0.4, 5.2); x.stroke();
  x.lineWidth = 1.3; x.beginPath(); x.arc(1, -1, 4.6, 2.4, 7.2); x.stroke();
  const hg = x.createRadialGradient(-3, -4, 1, 0, 0, 12); hg.addColorStop(0, 'rgba(255,255,255,.5)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = hg; x.beginPath(); x.arc(0, 0, 12, 0, 6.3); x.fill();
  return { c, w: 1, h: 1 };
}
function blossomSprite(petalCol: string, edge: string, heart: string): Spr {
  const S = 96, c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d')!; x.translate(S / 2, S / 2);
  for (let i = 0; i < 5; i++) {
    x.save(); x.rotate((i / 5) * 6.2832); x.translate(0, -8);
    const g = x.createLinearGradient(0, 0, 0, -34); g.addColorStop(0, heart); g.addColorStop(0.4, petalCol); g.addColorStop(1, '#ffffff');
    petalPath(x, 15, 34); x.fillStyle = g; x.fill(); x.lineWidth = 1; x.strokeStyle = edge; x.stroke(); x.restore();
  }
  x.fillStyle = '#e8c45a'; x.beginPath(); x.arc(0, 0, 5.2, 0, 6.3); x.fill();
  x.fillStyle = '#b88a2a'; for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(Math.cos(i * 0.9) * 7.5, Math.sin(i * 0.9) * 7.5, 1.4, 0, 6.3); x.fill(); }
  return { c, w: 1, h: 1 };
}
function blossomC(col: string): Spr {
  const S = 96, c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d')!; x.translate(S / 2, S / 2);
  const heart = mixc(col, '#3a1840', 0.3), edge = mixc(col, '#2a1030', 0.35);
  for (let i = 0; i < 5; i++) {
    x.save(); x.rotate((i / 5) * 6.2832); x.translate(0, -8);
    const g = x.createLinearGradient(0, 0, 0, -34); g.addColorStop(0, heart); g.addColorStop(0.4, col); g.addColorStop(1, mixc(col, '#ffffff', 0.7));
    petalPath(x, 15, 34); x.fillStyle = g; x.fill(); x.lineWidth = 1; x.strokeStyle = edge; x.globalAlpha = 0.4; x.stroke(); x.globalAlpha = 1; x.restore();
  }
  x.fillStyle = '#e8c45a'; x.beginPath(); x.arc(0, 0, 5.2, 0, 6.3); x.fill();
  x.fillStyle = '#b88a2a'; for (let i = 0; i < 7; i++) { x.beginPath(); x.arc(Math.cos(i * 0.9) * 7.5, Math.sin(i * 0.9) * 7.5, 1.4, 0, 6.3); x.fill(); }
  return { c, w: 1, h: 1 };
}
function ranSprite(b: string): Spr {
  const S = 128, c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d')!; x.translate(S / 2, S / 2);
  const sh = x.createRadialGradient(0, 3, 6, 0, 3, 58); sh.addColorStop(0, 'rgba(60,25,35,.25)'); sh.addColorStop(1, 'rgba(60,25,35,0)');
  x.fillStyle = sh; x.beginPath(); x.arc(0, 3, 58, 0, 6.3); x.fill();
  for (let k = 0; k < 8; k++) {
    const R = 46 - k * 5.6, n = 15 - k, pw = 10.5 - k * 0.9;
    for (let i = 0; i < n; i++) {
      x.save(); x.rotate((i / n) * 6.2832 + k * 0.5); x.translate(0, -R);
      const g = x.createRadialGradient(0, -pw * 0.4, 1, 0, 0, pw * 1.8);
      g.addColorStop(0, mixc(b, '#ffffff', 0.55 - k * 0.03)); g.addColorStop(0.7, mixc(b, '#ffffff', 0.12)); g.addColorStop(1, mixc(b, '#3a1020', 0.28));
      x.beginPath(); x.ellipse(0, 0, pw, pw * 1.35, 0, 0, 6.3); x.fillStyle = g; x.fill();
      x.lineWidth = 0.8; x.strokeStyle = 'rgba(70,25,40,.28)'; x.stroke(); x.restore();
    }
  }
  x.fillStyle = mixc(b, '#3a1020', 0.45); x.beginPath(); x.arc(0, 0, 3.4, 0, 6.3); x.fill();
  return { c, w: 1, h: 1 };
}
function dotsSprite(col: string): Spr {
  const S = 64, c = document.createElement('canvas'); c.width = S; c.height = S;
  const x = c.getContext('2d')!; x.translate(S / 2, S / 2);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = 4 + i * 2.8, cx = Math.cos(a) * r, cy = Math.sin(a) * r;
    const g = x.createRadialGradient(cx - 1, cy - 1, 0.5, cx, cy, 5); g.addColorStop(0, '#ffffff'); g.addColorStop(1, col);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 4.4, 0, 6.3); x.fill(); x.strokeStyle = 'rgba(80,60,70,.2)'; x.lineWidth = 0.6; x.stroke();
  }
  return { c, w: 1, h: 1 };
}

function petal(color: string): Spr {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const x = c.getContext('2d')!;
  x.beginPath(); x.moveTo(16, 30); x.bezierCurveTo(3, 25, 1, 10, 10, 4); x.quadraticCurveTo(14, 2, 16, 5); x.quadraticCurveTo(18, 2, 22, 4); x.bezierCurveTo(31, 10, 29, 25, 16, 30);
  x.fillStyle = color; x.fill();
  const g = x.createRadialGradient(14, 13, 1, 16, 17, 16); g.addColorStop(0, 'rgba(255,235,240,.42)'); g.addColorStop(0.7, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(90,10,30,.18)');
  x.fillStyle = g; x.fill();
  return { c, w: 1, h: 1.05 };
}
function stitch(color: string): Spr {
  const c = document.createElement('canvas'); c.width = 16; c.height = 40;
  const x = c.getContext('2d')!;
  x.strokeStyle = color; x.lineWidth = 3.4; x.lineCap = 'round';
  x.beginPath(); x.moveTo(8, 5); x.lineTo(8, 35); x.stroke();
  return { c, w: 0.42, h: 1.9 };
}
function leaf(color: string): Spr {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const x = c.getContext('2d')!;
  x.beginPath(); x.moveTo(16, 1); x.quadraticCurveTo(31, 16, 16, 31); x.quadraticCurveTo(1, 16, 16, 1);
  x.fillStyle = color; x.fill();
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(16, 4); x.lineTo(16, 28); x.stroke();
  return { c, w: 0.82, h: 1.15 };
}

export default function NameField({ names, active, tone = 'rose' }: { names: [string, string]; active: boolean; tone?: 'rose' | 'peach' | 'violet' | 'bloom' }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ start: () => void } | null>(null);

  useEffect(() => {
    const box = wrap.current, canvas = cv.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const host = (box.closest('.hero__frame') as HTMLElement) || box;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const pal = tone === 'peach' ? PEACH : tone === 'violet' ? VIOLET : { deep: DEEP, mid: MID, light: LIGHT, thread: THREAD };
    const leafPal = tone === 'violet' ? LEAF_BEIGE : LEAF;
    const bl = tone === 'bloom';
    const sprites: Spr[] = bl
      ? [...ROSES.map(roseSprite), ...BLOSSOMS.map(blossomC), ...ROSE_BASES.map(ranSprite), dotsSprite('#f1d9e0')]
      : [...pal.deep.map(petal), ...pal.mid.map(petal), ...pal.light.map(petal), ...pal.thread.map(stitch), ...leafPal.map(leaf)];
    const N_ROSE = ROSES.length, N_BLOSSOM = BLOSSOMS.length, I_RAN = N_ROSE + N_BLOSSOM, I_DOT = I_RAN + N_ROSE;
    const nDeep = pal.deep.length, nMid = pal.mid.length, nLight = pal.light.length, nThread = pal.thread.length;
    const pick = () => {
      const r = Math.random();
      if (r < 0.5) return Math.floor(Math.random() * nDeep);
      if (r < 0.66) return nDeep + Math.floor(Math.random() * nMid);
      if (r < 0.72) return nDeep + nMid + Math.floor(Math.random() * nLight);
      if (r < 0.9) return nDeep + nMid + nLight + Math.floor(Math.random() * nThread);
      return nDeep + nMid + nLight + nThread + Math.floor(Math.random() * leafPal.length);
    };

    let W = 0, H = 0, F = 0;
    let ps: P[] = [];
    let letters: Letter[] = [];
    let byLetter = new Map<number, P[]>();
    let raf = 0, running = false, t0 = 0, started = false, visible = true;
    let px = -999, py = -999, pActive = false;
    let hitP = -1, hitG = -1;
    let gust = { on: false, x: 0, y: 0, t: 0 };
    let gustTimer = 0;

    const letterAt = (x: number, y: number) => {
      for (const L of letters) if (x >= L.x0 && x <= L.x1 && y >= L.y0 && y <= L.y1) return L.id;
      return -1;
    };
    const neighbours = (id: number) => {
      const L = letters.find((l) => l.id === id);
      if (!L || L.line > 1) return [] as number[];
      return letters.filter((l) => l.line === L.line && Math.abs(l.idx - L.idx) === 1).map((l) => l.id);
    };
    const kick = (p: P, cx: number, cy: number, k: number) => {
      const dx = p.x - cx, dy = p.y - cy;
      const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.5;
      const sp = (2.4 + Math.random() * 3.2) * k;
      p.vx += Math.cos(a) * sp; p.vy += Math.sin(a) * sp - 1.1 * k; p.vr += (Math.random() - 0.5) * 0.5 * k;
      p.free = 34 + Math.random() * 46;
    };
    /** the hovered letter flies away fully; each neighbour sends only about half of its petals */
    const lift = (id: number, cx: number, cy: number, k0: number) => {
      const k = bl ? k0 * 1.35 : k0;
      for (const p of byLetter.get(id) || []) kick(p, cx, cy, k);
      for (const n of neighbours(id)) for (const p of byLetter.get(n) || []) if (p.sens > 0) kick(p, cx, cy, k * 0.55);
    };

    const build = async (assembled: boolean) => {
      try {
        await Promise.all([
          document.fonts.load('italic 600 64px "Cormorant Garamond"'),
          document.fonts.load('400 24px "Cormorant Garamond"'),
        ]);
      } catch { /* fall through with whatever font is present */ }
      W = box.clientWidth; H = box.clientHeight;
      if (!W || !H) return;
      // size from the height, but never wider than the box: the names always fit, at any screen
      F = H / 2.95;
      const m = document.createElement('canvas').getContext('2d')!;
      m.font = `italic 600 100px "Cormorant Garamond", Georgia, serif`;
      const widest = Math.max(m.measureText(names[0]).width, m.measureText(names[1]).width) / 100;
      F = Math.min(F, (W * 0.94) / widest);
      const oy = (H - F * 2.95) / 2;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);

      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d', { willReadFrequently: true })!;
      o.fillStyle = '#000'; o.textAlign = 'left'; o.textBaseline = 'alphabetic';
      const nameFont = `italic 600 ${F}px "Cormorant Garamond", Georgia, serif`;
      const ampFont = `500 ${F * 0.46}px "Cormorant Garamond", Georgia, serif`;

      // lay out every letter so each particle knows which letter it belongs to
      letters = [];
      const lines: [string, number, string, number][] = [[names[0], oy + F * 0.92, nameFont, 0], [names[1], oy + F * 2.52, nameFont, 1], ['&', oy + F * 1.66, ampFont, 2]];
      for (const [text, base, font, line] of lines) {
        o.font = font;
        const total = o.measureText(text).width, start = W / 2 - total / 2;
        for (let i = 0; i < text.length; i++) {
          const a = o.measureText(text.slice(0, i)).width, b = o.measureText(text.slice(0, i + 1)).width;
          const x0 = start + a, x1 = start + b;
          const y0 = oy + (line === 0 ? 0 : line === 1 ? F * 1.85 : F * 1.2);
          const y1 = oy + (line === 0 ? F * 1.2 : line === 1 ? F * 2.95 : F * 1.85);
          letters.push({ id: line * 100 + i, line, idx: i, x0: i === 0 ? x0 - F * 0.2 : x0, x1: i === text.length - 1 ? x1 + F * 0.2 : x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
        }
        o.fillText(text, start, base);
        if (tone === 'peach') { o.strokeStyle = '#000'; o.lineWidth = F * 0.03; o.lineJoin = 'round'; o.strokeText(text, start, base); }
        else if (bl) { o.strokeStyle = '#000'; o.lineWidth = F * 0.05; o.lineJoin = 'round'; o.strokeText(text, start, base); }
        else if (tone === 'violet') { o.strokeStyle = '#000'; o.lineWidth = F * 0.022; o.lineJoin = 'round'; o.strokeText(text, start, base); }
      }
      const data = o.getImageData(0, 0, W, H).data;

      const dense = tone === 'peach' || tone === 'violet';
      if (bl) {
        let st = Math.max(4, F * 0.058), pts: [number, number][] = [];
        for (let pass = 0; pass < 4; pass++) {
          pts = [];
          for (let y = st / 2; y < H; y += st) for (let x = st / 2; x < W; x += st) if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 110) pts.push([x, y]);
          if (pts.length <= 900) break;
          st *= Math.sqrt(pts.length / 850);
        }
        const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && data[((y | 0) * W + (x | 0)) * 4 + 3] > 110;
        byLetter = new Map(); ps = [];
        const add = (hx: number, hy: number, spr: number, s: number, rot: number, ta: number, lyr: number, delay: number) => {
          const letter = letterAt(hx, hy);
          const p: P = {
            hx, hy, x: assembled ? hx : hx + (Math.random() - 0.5) * 90, y: assembled ? hy : hy - 120 - Math.random() * 220,
            vx: 0, vy: 0, s, rot, r0: rot, vr: 0, spr, ph: Math.random() * 6.28, delay, free: 0, a: assembled ? ta : 0, ta, sens: Math.random() < 0.55 ? 0 : 0.5 + Math.random() * 0.5, letter, lyr
          } as P;
          if (letter >= 0) { const arr = byLetter.get(letter) || []; arr.push(p); byLetter.set(letter, arr); }
          ps.push(p);
        };
        for (const [x, y] of pts) {
          const hx = x + (Math.random() - 0.5) * st * 0.55, hy = y + (Math.random() - 0.5) * st * 0.55;
          const dl = 0.35 + (hx / W) * 1.0 + Math.random() * 0.35;
          const q = Math.random();
          if (q < 0.14) add(hx + (Math.random() - 0.5) * st, hy + (Math.random() - 0.5) * st, I_DOT, st * (1.7 + Math.random() * 0.6), Math.random() * 6.28, 0.95, 0, dl);
          if (q < 0.34) add(hx, hy, N_ROSE + (Math.random() < 0.55 ? (Math.random() < 0.5 ? 0 : 2) : 1), st * (1.3 + Math.random() * 0.35), Math.random() * 6.28, 0.97, 1, dl + 0.05);
          else {
            const rr = Math.random(), k = rr < 0.34 ? 0 : rr < 0.6 ? 1 : rr < 0.84 ? 3 : 2, ran = Math.random() < 0.4;
            add(hx, hy, ran ? I_RAN + k : k, st * (rr > 0.92 ? 2.3 : 1.75 + Math.random() * 0.45), Math.random() * 6.28, 0.98, 2, dl + 0.08);
          }
        }
        ps.sort((a, b2) => (a.lyr ?? 0) - (b2.lyr ?? 0));
      } else {
        let step = dense ? Math.max(1.15, F * 0.019) : Math.max(1.6, F * 0.029);
        let pts: [number, number][] = [];
        for (let pass = 0; pass < 3; pass++) {
          pts = [];
          for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) {
            if (data[((y | 0) * W + (x | 0)) * 4 + 3] > 110) pts.push([x, y]);
          }
          if (pts.length <= (dense ? 4200 : 2100)) break;
          step *= Math.sqrt(pts.length / (dense ? 4000 : 2000));
        }
        const base = F * (dense ? 0.044 : 0.068);
        byLetter = new Map();
        ps = pts.map(([x, y]) => {
          const hx = x + (Math.random() - 0.5) * step * 0.6, hy = y + (Math.random() - 0.5) * step * 0.6;
          const spr = pick();
          const thin = spr >= nDeep + nMid + nLight;
          const ta = (thin ? 0.55 : 0.72) * (0.92 + Math.random() * 0.08);
          const letter = letterAt(hx, hy);
          const p: P = {
            hx, hy,
            x: assembled ? hx : hx + (Math.random() - 0.5) * 90, y: assembled ? hy : hy - 120 - Math.random() * 220,
            vx: 0, vy: 0, s: base * (0.8 + Math.random() * 0.5), rot: Math.random() * 6.28, vr: 0, spr,
            ph: Math.random() * 6.28, delay: 0.35 + (hx / W) * 1.0 + Math.random() * 0.35, free: 0, a: assembled ? ta : 0, ta,
            sens: Math.random() < 0.5 ? 0 : 0.5 + Math.random() * 0.5, letter, r0: 0,
          };
          if (letter >= 0) { const arr = byLetter.get(letter) || []; arr.push(p); byLetter.set(letter, arr); }
          return p;
        });
      }
      if (reduced || assembled) draw(0);
    };

    const draw = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of ps) {
        if (p.a <= 0.01) continue;
        const sp = sprites[p.spr];
        const thin = !bl && sp.h > 1.5;
        const w = p.s * sp.w * (bl || thin ? 1 : 1.6), h = p.s * sp.h * (bl || thin ? 1 : 1.6);
        const tilt = p.free > 0 ? 0.55 + 0.45 * Math.abs(Math.cos(t * 3 + p.ph)) : 1;
        const ca = Math.cos(p.rot), sa = Math.sin(p.rot);
        ctx.setTransform(ca * dpr, sa * dpr, -sa * tilt * dpr, ca * tilt * dpr, p.x * dpr, p.y * dpr);
        ctx.globalAlpha = p.a;
        ctx.drawImage(sp.c, -w / 2, -h / 2, w, h);
      }
      ctx.globalAlpha = 1;
    };

    const step60 = (dt: number, t: number) => {
      // letters currently under a finger / cursor / the idle gust keep their petals in the air
      const holdAll = new Set<number>(), holdHalf = new Set<number>();
      for (const id of [pActive ? hitP : -1, gust.on ? hitG : -1]) {
        if (id < 0) continue;
        holdAll.add(id);
        for (const n of neighbours(id)) holdHalf.add(n);
      }
      let moving = pActive || gust.on || holdAll.size > 0;
      for (const p of ps) {
        if (t < p.delay) { moving = true; continue; }
        if (p.a < p.ta) { p.a = Math.min(p.ta, p.a + dt * 0.05); moving = true; }
        const near = holdAll.has(p.letter) || (holdHalf.has(p.letter) && p.sens > 0);
        if (p.free > 0) {
          if (!near) p.free -= dt;
          p.vx += Math.sin(t * 2 + p.ph) * 0.05 * dt; p.vy += (Math.cos(t * 1.7 + p.ph) * 0.04 - 0.012) * dt;
          const drag = Math.pow(0.965, dt); p.vx *= drag; p.vy *= drag; p.vr *= drag; p.rot += (p.vr + 0.02) * dt;
          moving = true;
        } else {
          const k = 0.06 * dt, damp = Math.pow(0.82, dt);
          p.vx = (p.vx + (p.hx - p.x) * k) * damp; p.vy = (p.vy + (p.hy - p.y) * k) * damp; p.vr *= damp;
          p.rot += p.vr * dt;
          if (bl) { const d = ((p.r0 - p.rot + Math.PI * 7) % (Math.PI * 2)) - Math.PI; p.rot += d * Math.min(1, 0.07 * dt); if (Math.abs(d) > 0.02) moving = true; }
          if (Math.abs(p.hx - p.x) + Math.abs(p.hy - p.y) > 0.12 || Math.abs(p.vx) + Math.abs(p.vy) > 0.03) moving = true;
        }
        p.x += p.vx * dt; p.y += p.vy * dt;
      }
      return moving;
    };

    let last = 0;
    const loop = (now: number) => {
      raf = 0;
      if (!visible) { running = false; return; }
      const dt = Math.min((now - last) / 16.667, 3); last = now;
      const t = (now - t0) / 1000;
      if (gust.on) {
        gust.t += dt / 60; const u = gust.t / 1.8;
        if (u >= 1) { gust.on = false; hitG = -1; }
        else {
          gust.x = -F * 0.3 + (W + F * 0.6) * u; gust.y = H * 0.3;
          const id = letterAt(gust.x, gust.y);
          if (id !== hitG) { hitG = id; if (id >= 0) lift(id, gust.x, gust.y, 0.7); }
        }
      }
      const moving = step60(dt, t);
      draw(t);
      if (moving) raf = requestAnimationFrame(loop); else running = false;
    };
    const kickLoop = () => { if (running || !visible || reduced || !started) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };

    const scheduleGust = (ms: number) => {
      gustTimer = window.setTimeout(() => {
        if (visible && !pActive) { gust = { on: true, x: -F, y: H * 0.3, t: 0 }; kickLoop(); }
        scheduleGust(9000);
      }, ms);
    };

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
    };
    const onMove = (e: PointerEvent) => {
      local(e); pActive = true;
      const id = letterAt(px, py);
      if (id !== hitP) { hitP = id; if (id >= 0) lift(id, px, py, 1); }
      kickLoop();
    };
    const onDown = (e: PointerEvent) => {
      local(e); pActive = true;
      const id = letterAt(px, py);
      hitP = id; if (id >= 0) lift(id, px, py, 1.5);
      kickLoop();
    };
    const onUp = (e: PointerEvent) => { if (e.pointerType !== 'mouse') { pActive = false; hitP = -1; } kickLoop(); };
    const onLeave = () => { pActive = false; hitP = -1; kickLoop(); };

    api.current = {
      start: () => {
        if (started) return;
        started = true; t0 = performance.now();
        if (!reduced) { kickLoop(); if (bl) { /* bursts only on hover / touch, and once as the names gather on load */ } else if (tone !== 'peach') scheduleGust(5200); }
      },
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kickLoop(); });
    io.observe(host);
    if (!reduced) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerdown', onDown);
      host.addEventListener('pointerup', onUp);
      host.addEventListener('pointercancel', onUp);
      host.addEventListener('pointerleave', onLeave);
    }
    let cancelled = false;
    build(reduced).then(() => { if (cancelled || reduced) return; if (started) kickLoop(); });
    const ro = new ResizeObserver(() => { if (started || reduced) build(true).then(() => draw(0)); });
    ro.observe(box);

    return () => {
      cancelled = true; cancelAnimationFrame(raf); clearTimeout(gustTimer); io.disconnect(); ro.disconnect();
      host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointerup', onUp); host.removeEventListener('pointercancel', onUp); host.removeEventListener('pointerleave', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names[0], names[1], tone]);

  useEffect(() => { if (active) api.current?.start(); }, [active]);

  return (
    <div className="names-fx" ref={wrap}>
      <canvas ref={cv} aria-hidden="true" />
    </div>
  );
}
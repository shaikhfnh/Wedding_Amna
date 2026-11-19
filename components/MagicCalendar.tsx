'use client';

import { useEffect, useRef, useState } from 'react';
import { event, nikah, reception } from '../lib/event';
import { onceVisible } from '../lib/fx';
import AddToCalendar from './AddToCalendar';

const WEEK_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEK_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const BLOB = 'M34 120C22 60 110 28 210 38S400 36 418 120C438 190 405 240 422 300S402 430 320 454S130 470 70 442S10 352 28 282S48 184 34 120Z';
const BLOB2 = 'M60 150C44 96 130 70 220 78S370 84 394 150C412 214 386 270 396 322S352 418 276 430S120 440 84 404S36 300 52 250S72 200 60 150Z';
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const arDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

/* Hijri (Umm al-Qura). Local moon sighting can differ by a day. */
const hijri = (() => {
  try {
    const en = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const ar = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const arM = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    const probe = en.formatToParts(new Date()).some((p) => p.type === 'month' && Number.isNaN(Number(p.value)));
    return { ok: probe, en: (d: Date) => `${en.format(d).replace(/^(\w+) (\d+), (\d+) AH$/, '$2 $1 $3')} AH`, ar: (d: Date) => ar.format(d), arMonth: (d: Date) => arM.format(d) };
  } catch { return { ok: false, en: () => '', ar: () => '', arMonth: () => '' }; }
})();

const hDay = (() => {
  try { const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', timeZone: 'UTC' }); return (dt: Date) => Number(f.formatToParts(dt).find((p) => p.type === 'day')?.value); }
  catch { return () => NaN; }
})();
const hParts = (dt: Date) => {
  try { const p = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-arab', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).formatToParts(dt);
    return { month: p.find((x) => x.type === 'month')?.value ?? '', year: `${p.find((x) => x.type === 'year')?.value ?? ''} هـ` }; } catch { return { month: '', year: '' }; }
};

/** The silk tassel, drawn so it catches light like the real thing. */
function Tassel() {
  const strands = Array.from({ length: 13 }, (_, i) => i);
  return (
    <svg className="wc__tsvg" viewBox="0 0 60 124" aria-hidden="true">
      <defs>
        <linearGradient id="tGold" x1="0" x2="1"><stop offset="0" stopColor="#a9822f" /><stop offset=".35" stopColor="#f6e2a3" /><stop offset=".6" stopColor="#d4ac55" /><stop offset="1" stopColor="#8f6a22" /></linearGradient>
        <linearGradient id="tSilk" x1="0" x2="1"><stop offset="0" stopColor="#c8486a" /><stop offset=".3" stopColor="#f08aa2" /><stop offset=".5" stopColor="#f9b4c3" /><stop offset=".72" stopColor="#e0607f" /><stop offset="1" stopColor="#b53a5a" /></linearGradient>
        <linearGradient id="tShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a1228" stopOpacity=".45" /><stop offset=".25" stopColor="#5a1228" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".15" /></linearGradient>
        <radialGradient id="tBead" cx="35%" cy="30%"><stop offset="0" stopColor="#fff6d0" /><stop offset=".5" stopColor="#d9b25e" /><stop offset="1" stopColor="#8f6a22" /></radialGradient>
      </defs>
      <circle cx="30" cy="7" r="6.4" fill="url(#tBead)" />
      <path d="M26 12h8l2 4v14h-12V16z" fill="url(#tGold)" />
      {[17, 21, 25].map((y) => <path key={y} d={`M24.4 ${y}h11.2`} stroke="#7a5518" strokeOpacity=".45" strokeWidth=".7" />)}
      <path d="M24.4 17l11.2 8M35.6 17l-11.2 8M24.4 21l11.2 8M35.6 21l-11.2 8" stroke="#7a5518" strokeOpacity=".28" strokeWidth=".5" />
      <ellipse cx="30" cy="31.5" rx="12" ry="3.6" fill="url(#tGold)" />
      <path d="M18.600 32C14 60 10 92 7 120h46C50 92 46 60 41.400 32z" fill="url(#tSilk)" />
      {strands.map((i) => {
        const t = i / 12, x1 = 20.4 + t * 19.2, x2 = 7.6 + t * 44.8;
        return <path key={i} d={`M${x1} 33C${x1 - (t - .5) * 8} 70 ${x2 + (t - .5) * 3} 96 ${x2} 119`} stroke={i % 2 ? 'rgba(255,255,255,.34)' : 'rgba(120,20,50,.22)'} strokeWidth=".7" fill="none" />;
      })}
      <path d="M18.600 32C14 60 10 92 7 120h46C50 92 46 60 41.400 32z" fill="url(#tShade)" />
      <path d="M17 58c10 3 16 3 26 0M13 82c13 4 21 4 34 0" fill="none" stroke="#d4ac55" strokeWidth="1.3" strokeOpacity=".85" />
      <path d="M7 120l2 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 3 3 3-3 2 3" fill="none" stroke="#c8486a" strokeWidth="1" strokeOpacity=".7" strokeLinecap="round" />
    </svg>
  );
}

/** Final calendar: watercolor wash month with layered depth, and a silk tassel that really hangs and swings.
 *  Pull the tassel (or tap it) to turn the month between English and Arabic. Tap a day for its Hijri date. */
export default function MagicCalendar() {
  const root = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const tas = useRef<HTMLDivElement>(null);
  const tipT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [on, setOn] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [bloom, setBloom] = useState(0);
  const [, setUsed] = useState(false);
  const [armed, setArmed] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; a: string; b: string; c: string; k: number } | null>(null);
  const langRef = useRef<'en' | 'ar'>('en');

  const [y, m, d] = event.start.slice(0, 10).split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const nameEn = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const nameAr = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('ar-u-ca-gregory-nu-latn', { month: 'long', timeZone: 'UTC' });
  const at = (n: number) => new Date(Date.UTC(y, m - 1, n, 12));
  // Arabic view: the Hijri month that holds the nikah, with Hijri day numbers
  const hd = hDay(at(d));
  const hOk = hijri.ok && !Number.isNaN(hd);
  const hStart = hOk ? new Date(at(d).getTime() - (hd - 1) * 864e5) : at(1);
  const hCount = hOk ? (() => { let n = 29; if (hDay(new Date(hStart.getTime() + 29 * 864e5)) === 30) n = 30; return n; })() : days;
  const hFirst = hStart.getUTCDay();
  const hHead = hOk ? hParts(at(d)) : { month: nameAr, year: arDigits(y) };
  const arMode = lang === 'ar' && hOk;
  const cells: (number | null)[] = arMode
    ? [...Array(hFirst).fill(null), ...Array.from({ length: hCount }, (_, i) => i + 1)]
    : [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const dN = Number(nikah.displayDate);                // the nikah day (same month as the reception)
  const hdN = hOk ? hDay(at(dN)) : NaN;
  const dMe = arMode ? hd : d;
  const dAlt = arMode ? hdN : dN;
  const dayDate = (n: number) => (arMode ? new Date(hStart.getTime() + (n - 1) * 864e5) : at(n));

  const switchLang = () => {
    const nxt = langRef.current === 'en' ? 'ar' : 'en';
    langRef.current = nxt; setLang(nxt); setUsed(true);
    try { navigator.vibrate?.(12); } catch { /* ignore */ }
  };

  // tilt (pointer and phone) and the tassel's physics
  useEffect(() => {
    const el = root.current, box = sheet.current, tz = tas.current; if (!el || !box || !tz) return;
    const stop = onceVisible(el, () => { setOn(true); setTimeout(() => setBloom((b) => b || 1), 3300); }, 0.3);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let tx = 0, ty = 0, cx = 0, cy = 0, tilting = 0;
    const T = { th: 0, w: 0, ext: 0, ev: 0, drag: false, px: 0, py: 0, lt: 0, lth: 0, moved: 0, id: -1, armed: false, t0: 0, vis: false, raf: 0, ax: 0, ay: 0 };
    const sw = () => box.clientWidth || 360;
    const L0 = () => sw() * 0.09, H = () => sw() * 0.2;

    const paint = () => {
      tz.style.transform = `rotate(${T.th.toFixed(2)}deg)`;
      tz.style.setProperty('--len', `${(L0() + T.ext).toFixed(1)}px`);
    };
    let last = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016); last = now;
      if (!T.drag) {
        const wind = reduced ? 0 : 0.25 * Math.sin(now / 1600);
        const acc = -13 * T.th - 1.05 * T.w + wind * 6;
        T.w += acc * dt; T.th += T.w * dt;
        const eacc = -150 * T.ext - 12 * T.ev; T.ev += eacc * dt; T.ext += T.ev * dt;
      }
      // pointer tilt for the sheet
      cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
      el.style.setProperty('--px', cx.toFixed(3)); el.style.setProperty('--py', cy.toFixed(3));
      paint();
      const quiet = !T.drag && Math.abs(T.w) < 0.05 && Math.abs(T.th) < 0.05 && Math.abs(T.ext) < 0.05 && Math.abs(tx - cx) + Math.abs(ty - cy) < 0.002 && reduced;
      T.raf = T.vis && !quiet ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!T.raf && T.vis) { last = 0; T.raf = requestAnimationFrame(loop); } };
    const io = new IntersectionObserver(([e]) => { T.vis = e.isIntersecting; if (T.vis) kick(); }, { rootMargin: '80px' });
    io.observe(el);

    // tilt
    const mv = (e: PointerEvent) => {
      if (reduced) return;
      const b = el.getBoundingClientRect();
      tx = clamp(((e.clientX - b.left) / b.width - 0.5) * 2, -1, 1); ty = clamp(((e.clientY - b.top) / b.height - 0.5) * 2, -1, 1); kick();
    };
    const lv = () => { tx = 0; ty = 0; kick(); };
    const ori = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = clamp(e.gamma / 28, -1, 1); ty = clamp((e.beta - 50) / 28, -1, 1); kick();
    };
    const enableTilt = () => {
      if (tilting) return; tilting = 1;
      const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (D && typeof D.requestPermission === 'function') D.requestPermission().then((r) => { if (r === 'granted') window.addEventListener('deviceorientation', ori); }).catch(() => undefined);
      else window.addEventListener('deviceorientation', ori);
    };
    if (!reduced) { el.addEventListener('pointermove', mv); el.addEventListener('pointerleave', lv); el.addEventListener('pointerdown', enableTilt, { once: true }); }

    // tassel drag
    const anchor = () => { const r = tz.parentElement!.getBoundingClientRect(); T.ax = r.left + r.width / 2; T.ay = r.top; };
    const down = (e: PointerEvent) => {
      T.drag = true; T.moved = 0; T.id = e.pointerId; T.armed = false; setArmed(false);
      anchor(); T.px = e.clientX; T.py = e.clientY; T.lt = performance.now(); T.lth = T.th; T.t0 = T.lt;
      tz.setPointerCapture(e.pointerId); tz.classList.add('wc__tas--held'); kick(); e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!T.drag || e.pointerId !== T.id) return;
      const dx = e.clientX - T.ax, dy = Math.max(24, e.clientY - T.ay);
      T.moved += Math.hypot(e.clientX - T.px, e.clientY - T.py); T.px = e.clientX; T.py = e.clientY;
      const th = clamp((Math.atan2(-dx, dy) * 180) / Math.PI * -1, -48, 48);
      const len = Math.hypot(dx, dy);
      const ext = clamp(len - L0() - H() * 0.45, -L0() * 0.25, sw() * 0.2);
      const now = performance.now(), dts = Math.max(0.008, (now - T.lt) / 1000);
      T.w = T.w * 0.5 + ((th - T.lth) / dts) * 0.5; T.lth = th; T.lt = now;
      T.th = th; T.ext = ext; T.ev = 0;
      const arm = ext > sw() * 0.07;
      if (arm !== T.armed) { T.armed = arm; setArmed(arm); if (arm) { try { navigator.vibrate?.(8); } catch { /* ignore */ } } }
    };
    const up = (e: PointerEvent) => {
      if (!T.drag || e.pointerId !== T.id) return;
      T.drag = false; tz.classList.remove('wc__tas--held'); T.w = clamp(T.w, -420, 420); setArmed(false);
      const tap = T.moved < 7 && performance.now() - T.t0 < 450;
      if (tap) { T.w += (Math.random() < 0.5 ? -1 : 1) * 110; T.ev += 260; switchLang(); }
      else if (T.armed) { T.ev -= 120; switchLang(); }
      T.armed = false; kick();
    };
    tz.addEventListener('pointerdown', down); tz.addEventListener('pointermove', move); tz.addEventListener('pointerup', up); tz.addEventListener('pointercancel', up);
    const keyd = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); T.w += 120; T.ev += 260; switchLang(); kick(); } };
    tz.addEventListener('keydown', keyd);
    // a first gentle swing as it arrives
    const hello = setTimeout(() => { T.w = 28; kick(); }, 2600);
    paint();

    return () => {
      stop?.(); io.disconnect(); clearTimeout(hello); cancelAnimationFrame(T.raf);
      el.removeEventListener('pointermove', mv); el.removeEventListener('pointerleave', lv); window.removeEventListener('deviceorientation', ori);
      tz.removeEventListener('pointerdown', down); tz.removeEventListener('pointermove', move); tz.removeEventListener('pointerup', up); tz.removeEventListener('pointercancel', up); tz.removeEventListener('keydown', keyd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spark = (x: number, y2: number, n: number) => {
    const host = sheet.current; if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'wc__sp'; s.style.left = x + 'px'; s.style.top = y2 + 'px'; host.appendChild(s);
      const a = Math.random() * 6.28, r = 36 + Math.random() * 70;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r}px)) scale(1)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r * 1.25}px),calc(-50% + ${Math.sin(a) * r * 1.25 + 14}px)) scale(.2)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.2,1)' }).finished.then(() => s.remove(), () => s.remove());
    }
  };

  const tap = (e: React.MouseEvent<HTMLElement>, n: number) => {
    const host = sheet.current; if (!host) return;
    const b = e.currentTarget.getBoundingClientRect(), s = host.getBoundingClientRect();
    const x = b.left - s.left + b.width / 2, y2 = b.top - s.top + b.height / 2;
    const drop = document.createElement('i'); drop.className = n === dMe ? 'wc__drop wc__drop--me' : 'wc__drop';
    drop.style.left = x + 'px'; drop.style.top = y2 + 'px'; host.appendChild(drop); setTimeout(() => drop.remove(), 2400);
    const dt = dayDate(n), diff = Math.round((dt.getTime() - at(d).getTime()) / 864e5), ar = langRef.current === 'ar';
    const isAlt = n === dAlt;
    const wd = dt.toLocaleString(ar ? 'ar' : 'en-US', { weekday: 'long', timeZone: 'UTC' });
    const rel = ar
      ? (diff === 0 ? `الاستقبال · الساعة ${arDigits(11)} صباحًا` : isAlt ? `عقد النكاح · الساعة ${arDigits(4)} مساءً` : diff < 0 ? `قبل ${arDigits(-diff)} يوم` : `بعد ${arDigits(diff)} يوم`)
      : (diff === 0 ? `Reception · ${reception.displayTime}` : isAlt ? `Nikah · ${nikah.displayTime}` : diff < 0 ? `${-diff} day${diff === -1 ? '' : 's'} before` : `${diff} day${diff === 1 ? '' : 's'} after`);
    setTip({ x: clamp((x / s.width) * 100, 24, 76), y: (y2 / s.height) * 100, a: ar ? `${wd} ${hijri.ar(dt)}` : `${wd}, ${dt.getUTCDate()} ${nameEn}`, b: ar ? dt.toLocaleString('ar-u-ca-gregory-nu-arab', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : (hijri.ok ? hijri.en(dt) : ''), c: rel, k: Date.now() });
    clearTimeout(tipT.current); tipT.current = setTimeout(() => setTip(null), 3200);
    if (n === dMe) {
      spark(x, y2, 10); setBloom((v) => v + 1);
      const btn = e.currentTarget; btn.classList.remove('wc__d--pop'); void btn.offsetWidth; btn.classList.add('wc__d--pop');
      try { navigator.vibrate?.(14); } catch { /* ignore */ }
    }
  };

  return (
    <section ref={root} id="calendar" className={`wc ${on ? 'wc--on' : ''} wc--${lang}`} data-lang={lang} aria-label="Save the date">

      <div className="wc__scene">
        <div className="wc__sheet" ref={sheet}>
          <div className="wc__rig">
            <svg className="wc__wash wc__wash--b" viewBox="0 0 440 470" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id="wcf2" x="-12%" y="-12%" width="124%" height="124%">
                  <feTurbulence type="fractalNoise" baseFrequency=".026" numOctaves="3" seed="21" result="n1" />
                  <feDisplacementMap in="SourceGraphic" in2="n1" scale="30" />
                </filter>
              </defs>
              <g filter="url(#wcf2)"><path d={BLOB2} fill="#f6c2cd" opacity=".55" /></g>
            </svg>
            <svg className="wc__wash" viewBox="0 0 440 470" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <filter id="wcf" x="-12%" y="-12%" width="124%" height="124%">
                  <feTurbulence type="fractalNoise" baseFrequency=".021" numOctaves="4" seed="9" result="n1" />
                  <feDisplacementMap in="SourceGraphic" in2="n1" scale="34" result="d" />
                  <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="3" result="n2" />
                  <feColorMatrix in="n2" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -1.5 1.2" result="m" />
                  <feComposite in="d" in2="m" operator="arithmetic" k1=".4" k2=".8" k3="0" k4="0" />
                </filter>
                <linearGradient id="wcg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbe8e4" /><stop offset=".55" stopColor="#f6d6d6" /><stop offset="1" stopColor="#fadfdc" /></linearGradient>
                <mask id="wcm" maskUnits="userSpaceOnUse" x="-20" y="0" width="480" height="470">
                  <g fill="none" stroke="#fff" strokeWidth="130" strokeLinecap="round" strokeLinejoin="round">
                    <path className="wc__st wc__st--1" pathLength={1} d="M10 120H430" />
                    <path className="wc__st wc__st--2" pathLength={1} d="M430 230H10" />
                    <path className="wc__st wc__st--3" pathLength={1} d="M10 340H430" />
                    <path className="wc__st wc__st--4" pathLength={1} d="M430 440H10" />
                  </g>
                </mask>
              </defs>
              <g mask="url(#wcm)">
                <g filter="url(#wcf)">
                  <path d={BLOB} fill="url(#wcg)" />
                  <path d={BLOB} fill="none" stroke="#f2b4c2" strokeWidth="5" opacity=".34" />
                </g>
              </g>
            </svg>

            <div className="wc__hd" aria-hidden="true">
              <b className="wc__en">{nameEn}</b>
              <b className="wc__ar">{hHead.month}</b>
              <span className="wc__en wc__sub">{y}</span>
              <span className="wc__ar wc__sub">{hHead.year}</span>
            </div>
            <h2 className="sr-only">{lang === 'ar' ? `${nameAr} ${arDigits(y)}` : `${nameEn} ${y}`}</h2>

            <div className="wc__grid" role="grid" aria-label={`${nameEn} ${y}`}>
              {WEEK_EN.map((w, i) => (
                <i key={i} className="wc__wk" role="columnheader" style={{ ['--i' as string]: i }}>
                  <span className="wc__en">{w}</span><span className="wc__ar">{WEEK_AR[i]}</span>
                </i>
              ))}
              {cells.map((n, i) => {
                if (n === null) return <b key={i} aria-hidden="true" />;
                const sty = { ['--i' as string]: i };
                const face = (
                  <span className="wc__fl">
                    <span className="wc__fa">{n}</span>
                    <span className="wc__fa wc__fb" aria-hidden="true">{arDigits(n)}</span>
                  </span>
                );
                if (n === dMe) {
                  return (
                    <button key={i} type="button" className="wc__d wc__d--me" style={sty} onClick={(e) => tap(e, n)} aria-label={`${event.displayDay}, ${n} ${nameEn} ${y}`}>
                      <i className={`wc__halo ${bloom ? 'wc__halo--on' : ''}`} key={`h${bloom}`} />
                      <svg className="wc__pen" viewBox="0 0 48 34" preserveAspectRatio="none" aria-hidden="true"><path pathLength={1} d="M6 18C2 4 22 -2 42 4C60 10 58 28 34 30C14 32 -2 24 6 8" /></svg>
                      {face}
                    </button>
                  );
                }
                if (n === dAlt) {
                  return (
                    <button key={i} type="button" className="wc__d wc__d--alt" style={sty} onClick={(e) => tap(e, n)} aria-label={`${nikah.displayDay}, ${n} ${nameEn} ${y}, Nikah`}>
                      <svg className="wc__pen" viewBox="0 0 48 34" preserveAspectRatio="none" aria-hidden="true"><path pathLength={1} d="M6 18C2 4 22 -2 42 4C60 10 58 28 34 30C14 32 -2 24 6 8" /></svg>
                      {face}
                    </button>
                  );
                }
                return <button key={i} type="button" className="wc__d" style={sty} onClick={(e) => tap(e, n)} tabIndex={-1} aria-hidden="true">{face}</button>;
              })}
            </div>
            <div className="wc__pin" aria-hidden="true"><i /></div>
            <div className="wc__tas-a">
              <div
              ref={tas} className={`wc__tas ${armed ? 'wc__tas--armed' : ''}`} role="button" tabIndex={0}
              aria-label={lang === 'en' ? 'Pull the tassel to show the calendar in Arabic' : 'Pull the tassel to show the calendar in English'}
            >
              <i className="wc__cord" />
              <Tassel />
            </div>
            </div>

          </div>

          {tip && (
            <div className="wc__tip" key={tip.k} style={{ left: `${tip.x}%`, top: `${tip.y}%` }} role="status">
              <b>{tip.a}</b>
              {tip.b && <span>{tip.b}</span>}
              <small>{tip.c}</small>
            </div>
          )}
        </div>
      </div>

      <p className="wc__hint" aria-hidden="true">
        <span className="wc__en">{hijri.ok ? `${hDay(at(dN))} & ${hijri.en(at(d))}` : event.displayMonthYear}</span>
        <span className="wc__ar" lang="ar">{hijri.ok ? hijri.ar(at(d)) : 'اسحب الشرابة'}</span>
      </p>
      <AddToCalendar />
    </section>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { event, nikah } from '../lib/event';
import NameField from './NameField';
import OpenButton from './OpenButton';
import { videoSrc, prepVideo } from '../lib/media';

/* eslint-disable @next/next/no-img-element */
const POSTER = '/media/couple-poster.webp';
type VState = 'idle' | 'playing' | 'loop' | 'failed';

/* petals drifting past the couple: fixed numbers, so the server and the browser draw the same thing */
const PETALS = Array.from({ length: 12 }, (_, i) => ({
  x: (i * 29 + 6) % 96, s: 8 + (i % 4) * 2, t: 11 + (i % 5) * 1.8, d: -((i * 1.7) % 12), sw: (i % 2 ? -1 : 1) * (16 + (i % 3) * 10),
}));

/** Opening scene (the clip starts only once the envelope has opened, `active`):
 *  the whole garden frame, full width, never cropped. The clip plays once, then a second clip that starts exactly on its
 *  last frame (a calm forward-and-back loop) takes over, so it never freezes. Names are petals and thread; tiny glowing
 *  petals float over everything. */
export default function Hero({ active = true, warm = true }: { active?: boolean; warm?: boolean }) {
  const [reduced, setReduced] = useState(true); // assume no motion until we know
  const [vs, setVs] = useState<VState>('idle');
  const main = useRef<HTMLVideoElement>(null);
  const loop = useRef<HTMLVideoElement>(null);
  const head = useRef<HTMLElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // a very light parallax: the petals, the lantern glow and the names drift a few pixels with the pointer or the tilt of the phone
  useEffect(() => {
    if (reduced) return;
    const el = head.current;
    if (!el) return;
    let raf = 0, nx = 0, ny = 0;
    const apply = () => { raf = 0; el.style.setProperty('--px', nx.toFixed(3)); el.style.setProperty('--py', ny.toFixed(3)); };
    const set = (x: number, y: number) => { nx = Math.max(-1, Math.min(1, x)); ny = Math.max(-1, Math.min(1, y)); if (!raf) raf = requestAnimationFrame(apply); };
    const onPtr = (e: PointerEvent) => { if (e.pointerType === 'mouse') set((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2); };
    const onTilt = (e: DeviceOrientationEvent) => { if (e.gamma != null && e.beta != null) set(e.gamma / 24, (e.beta - 55) / 30); };
    window.addEventListener('pointermove', onPtr, { passive: true });
    window.addEventListener('deviceorientation', onTilt, { passive: true });
    return () => { window.removeEventListener('pointermove', onPtr); window.removeEventListener('deviceorientation', onTilt); if (raf) cancelAnimationFrame(raf); };
  }, [reduced]);

  // choose the right file for this device (mobile = lighter 1080p H.264, which every iPhone can decode)
  useEffect(() => {
    if (reduced) return;
    const m = main.current, l = loop.current;
    if (!m || !l) return;
    [m, l].forEach(prepVideo);
    m.src = videoSrc('couple');
    l.src = videoSrc('loop');
  }, [reduced]);

  // fetch the first clip while the envelope video is playing, never before (the envelope gets the bandwidth first)
  useEffect(() => {
    const v = main.current;
    if (reduced || !v || !warm) return;
    v.preload = 'auto';
    if (v.readyState === 0 && v.paused) v.load(); // never reset a clip that is already starting (iOS)
  }, [reduced, warm]);

  // play the first clip once
  useEffect(() => {
    const v = main.current;
    if (reduced || !v || !active) return;
    let gone = false;
    v.dataset.go = '1'; // tells the envelope's priming that this clip is now meant to play
    const go = () => {
      v.play().then(() => { if (!gone) { off(); setVs('playing'); } }).catch(() => { if (!gone) setVs('failed'); });
    };
    // if the browser refuses to start it on its own (iOS Low Power Mode), the first touch starts it
    const off = () => {
      ['pointerdown', 'touchstart', 'keydown'].forEach((e) => window.removeEventListener(e, go));
    };
    try { v.currentTime = 0; } catch { /* not loaded yet */ }
    go();
    ['pointerdown', 'touchstart', 'keydown'].forEach((e) => window.addEventListener(e, go, { passive: true }));
    return () => { gone = true; off(); };
  }, [reduced, active]);

  // while the first clip plays, fetch the loop clip
  useEffect(() => {
    const l = loop.current;
    if (vs !== 'playing' || !l) return;
    l.preload = 'auto';
    l.load();
  }, [vs]);

  const toLoop = () => {
    const l = loop.current;
    if (!l) return;
    l.currentTime = 0;
    l.play().then(() => setVs('loop')).catch(() => undefined); // on failure the first clip simply holds its last frame
  };

  return (
    <header ref={head} className={`hero ${vs !== 'idle' ? 'hero--video' : ''}`}>
      <div className="hero__frame fit__frame">
        <img className="fit__media hero__poster" src={POSTER} alt="" width={1080} height={1920} fetchPriority="high" />
        {!reduced && (
          <>
            <video ref={main} className={`fit__media hero__vid ${vs !== 'idle' && vs !== 'failed' ? 'on' : ''}`} muted playsInline preload="none"
              disablePictureInPicture onEnded={toLoop} onError={() => setVs('failed')} aria-hidden="true" />
            <video ref={loop} className={`fit__media hero__vid hero__vid--loop ${vs === 'loop' ? 'on' : ''}`} muted playsInline loop preload="none"
              disablePictureInPicture aria-hidden="true" />
          </>
        )}
        <div className="hero__shade" aria-hidden="true" />
        {!reduced && (
          <div className="hero__fx" aria-hidden="true">
            <i className="hero__glow hero__glow--l" />
            <i className="hero__glow hero__glow--r" />
            {PETALS.map((p, i) => (
              <i key={i} className="hero__petal" style={{ ['--x' as string]: `${p.x}%`, ['--s' as string]: `${p.s}px`, ['--t' as string]: `${p.t}s`, ['--d' as string]: `${p.d}s`, ['--sw' as string]: `${p.sw}px` }} />
            ))}
          </div>
        )}

        <div className="hero__text">
          <p className="hero__bless">With the blessings of Allah</p>
          <p className="hero__pre">The wedding reception of</p>
          <h1 className="hero__names">
            <span className="sr-only">{event.brideFull} and {event.groomFull}</span>
            <NameField names={[event.bride, event.groom]} active={active} />
          </h1>
          <p className="hero__full">{event.brideFull} &amp; {event.groomFull}</p>
          <span className="hero__rule" aria-hidden="true" />
          <p className="hero__date">{event.displayDay} &middot; {event.displayDate} {event.displayMonthYear} &middot; {event.displayTime}</p>
          <p className="hero__nikah">Nikah &middot; {nikah.displayDay} {nikah.displayDate} {nikah.displayMonthYear.split(",")[0].slice(0, 3)} &middot; {nikah.displayTime}</p>
        </div>

        <OpenButton href="#invitation" label="See the details" />
      </div>
    </header>
  );
}
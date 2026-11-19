'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { setLenis, goTo } from '../lib/nav';

/** Inertial wheel/trackpad scrolling plus eased anchor jumps. Skipped for reduced motion. Touch keeps native momentum. */
export default function SmoothScroll({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, smoothWheel: true });
    setLenis(lenis);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const sel = a.getAttribute('href') || '';
      if (!document.querySelector(sel)) return;
      e.preventDefault();
      goTo(sel);
    };
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('click', onClick); setLenis(null); lenis.destroy(); };
  }, [enabled]);
  return null;
}
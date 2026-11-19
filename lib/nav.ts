import type Lenis from 'lenis';

let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => { lenis = l; };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Glide to a section (a CSS selector) or to a pixel offset. The trip takes longer the further it is. */
export function goTo(target: string | number) {
  const el = typeof target === 'string' ? (document.querySelector(target) as HTMLElement | null) : null;
  const y = typeof target === 'number' ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0;
  if (typeof target === 'string' && !el) return;
  const dist = Math.abs(y - window.scrollY);
  const duration = Math.min(2.6, Math.max(1.1, 0.8 + dist / 2600));
  if (lenis) lenis.scrollTo(y, { duration, easing: ease });
  else window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

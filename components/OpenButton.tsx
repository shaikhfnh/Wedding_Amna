'use client';

import { useRef } from 'react';

/** Slim glass bubble. The highlight follows the pointer, it squishes on press and springs back,
 *  and a few tiny bubbles pop off when it is tapped. */
export default function OpenButton({ href, label }: { href: string; label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLAnchorElement>(null);
  const anim = useRef<Animation | null>(null);

  const squish = () => {
    const el = btn.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    anim.current?.cancel();
    anim.current = el.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(.94,.9)' }], { duration: 110, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' });
  };
  const release = () => {
    const el = btn.current;
    if (!el || !anim.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { anim.current.cancel(); anim.current = null; return; }
    anim.current.cancel();
    anim.current = el.animate(
      [{ transform: 'scale(.94,.9)' }, { transform: 'scale(1.06,1.08)', offset: 0.38 }, { transform: 'scale(.985,.98)', offset: 0.68 }, { transform: 'scale(1,1)' }],
      { duration: 520, easing: 'cubic-bezier(.23,1,.32,1)' },
    );
    anim.current.onfinish = () => { anim.current = null; };
  };
  const move = (e: React.PointerEvent) => {
    const el = btn.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
  };
  const pop = () => {
    const w = wrap.current, el = btn.current;
    if (!w || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const wr = w.getBoundingClientRect(), br = el.getBoundingClientRect();
    const cx = br.left - wr.left + br.width / 2, cy = br.top - wr.top + br.height / 2;
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('i');
      b.className = 'bub';
      const s = 4 + Math.random() * 8;
      b.style.cssText = `width:${s}px;height:${s}px;left:${cx - s / 2 + (Math.random() - 0.5) * br.width * 0.7}px;top:${cy - s / 2}px`;
      w.appendChild(b);
      const dx = (Math.random() - 0.5) * 70, dy = -(24 + Math.random() * 56);
      b.animate(
        [{ transform: 'translate(0,0) scale(.3)', opacity: 0 }, { transform: `translate(${dx * 0.5}px,${dy * 0.6}px) scale(1)`, opacity: 0.95, offset: 0.35 }, { transform: `translate(${dx}px,${dy}px) scale(1.15)`, opacity: 0 }],
        { duration: 760 + Math.random() * 520, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'forwards' },
      ).onfinish = () => b.remove();
    }
  };

  return (
    <div className="hero__scroll" ref={wrap}>
      <a
        className="obtn" href={href} ref={btn} aria-label="Scroll to the invitation"
        onPointerDown={squish} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}
        onPointerMove={move} onClick={pop}
      >
        <span className="obtn__txt">{label}</span>
        <svg className="obtn__arrow" viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
      </a>
    </div>
  );
}

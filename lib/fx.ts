/** A soft burst of falling petals, drawn with the Web Animations API. `host` must be position:relative/absolute. */
export function petalBurst(host: HTMLElement, x: number, y: number, o: { n?: number; colors?: string[]; spread?: number } = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const n = o.n ?? 14, spread = o.spread ?? 70;
  const col = o.colors ?? ['#f1b3c1', '#e58ca2', '#f5c8d2', '#fffaf3', '#df7f97'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'fx-petal';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.background = col[i % col.length];
    host.appendChild(s);
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const r = spread * (0.5 + Math.random() * 0.8);
    s.animate(
      [
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0)', opacity: 0 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r * 0.55}px),calc(-50% + ${Math.sin(a) * r * 0.55 - 20}px)) scale(1) rotate(${60 + i * 12}deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * r}px),calc(-50% + ${Math.sin(a) * r + 56}px)) scale(.5) rotate(${200 + i * 18}deg)`, opacity: 0 },
      ],
      { duration: 1300 + Math.random() * 700, easing: 'cubic-bezier(.2,.7,.2,1)', delay: Math.random() * 120 },
    ).finished.then(() => s.remove(), () => s.remove());
  }
}

/** Runs `fn` once when `el` is at least `t` visible. Falls back to running at once. */
export function onceVisible(el: Element, fn: () => void, t = 0.35) {
  if (!('IntersectionObserver' in window)) { fn(); return () => undefined; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(); io.disconnect(); } }, { threshold: t });
  io.observe(el);
  return () => io.disconnect();
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { prepVideo } from '../lib/media';

export type Phase = 'closed' | 'opening' | 'open';

export default function Intro({ phase, onOpen, onDone }: { phase: Phase; onOpen: () => void; onDone: () => void }) {
  const vid = useRef<HTMLVideoElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  // iOS ignores preload and never loads a video until play() is called, so we start it silently once to
  // buffer the first frames, then park it on the poster until the guest taps.
  useEffect(() => {
    const v = vid.current;
    if (!v || reduced) return;
    prepVideo(v);
    v.play().then(() => {
      if (phaseRef.current === 'closed') { v.pause(); try { v.currentTime = 0; } catch { /* ignore */ } }
    }).catch(() => undefined);
  }, [reduced]);

  useEffect(() => {
    if (phase !== 'opening') return;
    const v = vid.current;
    // reduced motion or no video: short fade straight to the invitation
    if (reduced || failed || !v) {
      const t = setTimeout(() => done.current(), 700);
      return () => clearTimeout(t);
    }
    setLoading(true);
    let cap = 0, bail = 0;
    const onPlaying = () => {
      clearTimeout(bail);
      setLoading(false);
      clearTimeout(cap);
      // safety net only: just past the real length of the clip
      cap = window.setTimeout(() => done.current(), ((v.duration || 8.2) + 0.7) * 1000);
    };
    v.addEventListener('playing', onPlaying);
    try { v.currentTime = 0; } catch { /* ignore */ }
    const p = v.play(); // called straight from the tap, so iOS always allows it
    if (p) p.catch(() => setFailed(true));
    if (!v.paused && v.readyState >= 3) onPlaying();
    // only if the clip truly never starts (offline / blocked) do we let the guest through
    bail = window.setTimeout(() => { setLoading(false); done.current(); }, 15000);
    return () => { v.removeEventListener('playing', onPlaying); clearTimeout(bail); clearTimeout(cap); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, failed, reduced]);

  // after the clip, the envelope dissolves over the invitation (which is already starting) instead of cutting
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (phase !== 'open') return;
    const t = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'open' && gone) return null;

  const begin = () => {
    const v = vid.current;
    if (v) { prepVideo(v); v.play().catch(() => undefined); }
    // inside this tap, also let the landing video start once, so iOS (even in Low Power Mode) lets it play later
    document.querySelectorAll<HTMLVideoElement>('video.hero__vid:not(.hero__vid--loop)').forEach((h) => {
      prepVideo(h);
      h.play().then(() => { if (!h.dataset.go) { h.pause(); try { h.currentTime = 0; } catch { /* ignore */ } } }).catch(() => undefined);
    });
    if (!reduced) { try { navigator.vibrate?.(14); } catch { /* ignore */ } }
    onOpen();
  };


  return (
    <div className={`intro intro--${phase}`} role="dialog" aria-modal="true" aria-label="Open the invitation">
      <div className="intro__ext intro__ext--t" aria-hidden="true" />
      <div className="intro__ext intro__ext--b" aria-hidden="true" />
      <div className="fit__frame">
        {!reduced && (
          <video
            ref={vid}
            className="fit__media intro__video"
            poster="/media/envelope-poster.jpg"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onEnded={() => done.current()}
            onTimeUpdate={(e) => { const v = e.currentTarget; if (phaseRef.current === 'opening' && v.duration && v.duration - v.currentTime < 0.1) done.current(); }}
            onError={() => setFailed(true)}
            aria-hidden="true"
          >
            <source src="/media/envelope.mp4" type="video/mp4" />
            <source src="/media/envelope.webm" type="video/webm" />
          </video>
        )}
        <span className="intro__ring" aria-hidden="true"><i /><i /></span>
        {reduced && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="fit__media intro__video" src="/media/envelope-poster.jpg" alt="" aria-hidden="true" />
        )}
      </div>

      <button className="intro__tap" onClick={begin} disabled={phase !== 'closed'} aria-label="Open the invitation">
        <span className="intro__hint"><em aria-hidden="true" />{loading ? 'Opening…' : 'Tap the seal to open'}<em aria-hidden="true" /></span>
      </button>

      {phase !== 'closed' && !reduced && (
        <span className="intro__burst" aria-hidden="true">
          <b />
          {Array.from({ length: 10 }, (_, k) => <i key={k} style={{ ['--a' as string]: `${k * 36 + 12}deg`, ['--r' as string]: `${58 + (k % 3) * 18}px` }} />)}
        </span>
      )}


      {loading && <span className="intro__spin" aria-hidden="true" />}
    </div>
  );
}
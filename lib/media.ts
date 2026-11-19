/** Picks the video file this device can actually play well.
 *  Phones and tablets get the lighter 1080p H.264 (every iPhone decodes it in hardware);
 *  desktop Chrome/Firefox/Edge get VP9 WebM; desktop Safari gets the 1440p H.264. */
export function videoSrc(name: 'couple' | 'loop'): string {
  const ua = navigator.userAgent;
  const touch =
    window.matchMedia('(pointer: coarse)').matches ||
    /iPhone|iPad|iPod|Android/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Mac/i.test(ua));
  const small = Math.min(window.screen.width, window.screen.height) <= 900;
  if (touch || small) return `/media/${name}-m.mp4`;
  const safari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  const webm = document.createElement('video').canPlayType('video/webm; codecs="vp9"') === 'probably';
  return webm && !safari ? `/media/${name}-1440.webm` : `/media/${name}-1440.mp4`;
}

/** iOS only plays a video silently and inline when these are set as real attributes, not just properties. */
export function prepVideo(v: HTMLVideoElement) {
  v.muted = true;
  v.defaultMuted = true;
  v.setAttribute('muted', '');
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.removeAttribute('controls');
}

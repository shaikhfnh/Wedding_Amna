import { event } from './event';

/**
 * Background music, one tiny store shared by the page and the picker.
 * - start() must be called inside the user's tap (browsers only allow sound after a gesture).
 * - Switching tracks re-uses the SAME <audio> element (so iOS keeps its permission) and cross-fades.
 * - Every track is mastered to the same quiet level (−26 LUFS), so on iPhones, where JS cannot change
 *   the volume, it is still calm; on other devices the volume also fades and can be set by the slider.
 */
export type Track = { id: string; name: string; sub?: string; src: string };
type Cfg = { enabled: boolean; src: string; picker?: boolean; volume?: number; tracks?: Track[] };
const cfg = event.music as Cfg;

export const enabled = cfg.enabled;
export const tracks: Track[] = cfg.tracks?.length ? cfg.tracks : [{ id: 'main', name: 'Music', src: cfg.src }];
export const picker = !!cfg.picker && tracks.length > 1;

type State = { playing: boolean; trackId: string; volume: number };
let state: State = { playing: false, trackId: tracks[0].id, volume: cfg.volume ?? 0.5 };
let audio: HTMLAudioElement | null = null;
let raf = 0;
const subs = new Set<() => void>();

export const getState = () => state;
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const set = (p: Partial<State>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const current = () => tracks.find((t) => t.id === state.trackId) ?? tracks[0];

function fade(a: HTMLAudioElement, to: number, ms: number, then?: () => void) {
    cancelAnimationFrame(raf);
    const from = a.volume, t0 = performance.now();
    const tick = (now: number) => {
        const u = Math.min(1, (now - t0) / ms);
        a.volume = clamp(from + (to - from) * (1 - Math.pow(1 - u, 2)));
        if (u < 1) raf = requestAnimationFrame(tick); else then?.();
    };
    raf = requestAnimationFrame(tick);
}

function ensure(): HTMLAudioElement {
    if (!audio) {
        const a = new Audio(current().src);
        a.loop = true; a.preload = 'auto'; a.volume = 0;
        audio = a;
        // a guest leaving the tab should not keep playing
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && audio && !audio.paused) { cancelAnimationFrame(raf); audio.pause(); set({ playing: false }); }
        });
    }
    return audio;
}

function playFaded(a: HTMLAudioElement, ms: number) {
    a.volume = 0;
    a.play().then(() => { set({ playing: true }); fade(a, state.volume, ms); }).catch(() => set({ playing: false }));
}

/** Call from the tap that opens the invitation. */
export function start() { if (enabled) playFaded(ensure(), 4000); }

export function toggle() {
    if (!enabled) return;
    const a = ensure();
    if (a.paused) playFaded(a, 1500);
    else { set({ playing: false }); fade(a, 0, 500, () => a.pause()); }
}

/** Choose a track; it starts playing (cross-faded) so you can compare by ear. */
export function select(id: string) {
    const t = tracks.find((x) => x.id === id);
    if (!t || !enabled) return;
    const a = ensure();
    if (t.id === state.trackId && !a.paused) return;
    const wasPlaying = !a.paused;
    set({ trackId: t.id });
    const swap = () => { a.src = t.src; a.currentTime = 0; playFaded(a, 1800); };
    if (wasPlaying) fade(a, 0, 450, swap); else swap();
}

export function setVolume(v: number) {
    const val = clamp(v);
    set({ volume: val });
    if (audio && !audio.paused) { cancelAnimationFrame(raf); audio.volume = val; }
}
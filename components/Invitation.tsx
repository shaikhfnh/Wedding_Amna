'use client';

import { useCallback, useEffect, useState } from 'react';
import { useReveal } from '../lib/hooks';
import Intro, { type Phase } from './Intro';
import Hero from './Hero';
import MagicCalendar from './MagicCalendar';
import Countdown from './Countdown';
import DateLine from './DateLine';
import Programme from './Programme';
import VenuePanel from './VenuePanel';
import Closing from './Closing';
import SmoothScroll from './SmoothScroll';
import ScrollThread from './ScrollThread';
import MusicPlayer from './MusicPlayer';
import { start as startMusic } from '../lib/music';

/** Hero · Date · The two days · Calendar · Countdown · Venue · Footer. */
export default function Invitation() {
  const [phase, setPhase] = useState<Phase>('closed');

  useReveal([phase]);

  useEffect(() => {
    document.documentElement.classList.toggle('locked', phase !== 'open');
    return () => document.documentElement.classList.remove('locked');
  }, [phase]);

  const open = useCallback(() => {
    setPhase('opening');
    startMusic(); // inside the tap: browsers only allow sound after a gesture
  }, []);

  const finishIntro = useCallback(() => setPhase('open'), []);

  return (
    <>
      <SmoothScroll enabled={phase === 'open'} />
      <Intro phase={phase} onOpen={open} onDone={finishIntro} />

      <main className={`page ${phase !== 'open' ? 'page--hidden' : 'page--shown'}`} aria-hidden={phase !== 'open'}>
        <Hero active={phase === 'open'} warm={phase !== 'closed'} />
        <span id="invitation" aria-hidden="true" />
        <DateLine />
        <Programme />
        <MagicCalendar />
        <Countdown />
        <VenuePanel />
      </main>

      {/* the closing scene is full screen, so it lives outside the page column */}
      <div id="closing" className={`closing-wrap ${phase !== 'open' ? 'page--hidden' : 'page--shown'}`} aria-hidden={phase !== 'open'}>
        <Closing />
      </div>

      {phase === 'open' && <ScrollThread />}

      {phase !== 'closed' && <MusicPlayer />}
    </>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Cinematic hero loop. Rendered only after mount and only when the visitor allows motion,
 * so the server-rendered screenshot composition stays visible while the video loads and
 * remains the fallback for reduced motion, blocked autoplay or unsupported formats.
 * The parent hero receives data-video="playing" once real frames are on screen.
 */
export function HeroVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const update = () => setMotionAllowed(!query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const hero = video?.closest('section');
    if (!video || !motionAllowed) {
      hero?.removeAttribute('data-video');
      return;
    }
    const markPlaying = () => hero?.setAttribute('data-video', 'playing');
    const markStopped = () => hero?.removeAttribute('data-video');
    video.addEventListener('playing', markPlaying);
    video.addEventListener('error', markStopped);
    video.play().catch(markStopped);
    return () => {
      video.removeEventListener('playing', markPlaying);
      video.removeEventListener('error', markStopped);
      markStopped();
    };
  }, [motionAllowed]);

  if (!motionAllowed) return null;

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      disablePictureInPicture
      disableRemotePlayback
    >
      <source src="/videos/tier-trade-hero-loop-1080.mp4" type="video/mp4" media="(max-width: 1280px)" />
      <source src="/videos/tier-trade-hero-loop.mp4" type="video/mp4" />
    </video>
  );
}

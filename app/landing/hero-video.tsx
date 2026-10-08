'use client';

import { useEffect, useRef, useState } from 'react';

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Background loop behind the hero headline. Mounted only after hydration and only when the
 * visitor allows motion; the section's gradient stays as the fallback until real frames play.
 * The parent hero gets data-video="playing" once frames are on screen.
 */
export function HeroVideo({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const video = videoRef.current;
    const hero = video?.closest('section');
    if (!video || reduced) { hero?.removeAttribute('data-video'); return; }
    const markPlaying = () => hero?.setAttribute('data-video', 'playing');
    const markStopped = () => hero?.removeAttribute('data-video');
    const onVisibility = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(markStopped); else video.pause();
    });
    video.addEventListener('playing', markPlaying);
    video.addEventListener('error', markStopped);
    onVisibility.observe(video);
    return () => {
      onVisibility.disconnect();
      video.removeEventListener('playing', markPlaying);
      video.removeEventListener('error', markStopped);
      markStopped();
    };
  }, [mounted, reduced]);

  if (!mounted || reduced) return null;

  return (
    <video ref={videoRef} className={className} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" tabIndex={-1} disablePictureInPicture disableRemotePlayback>
      <source src="/videos/tier-trade-hero-loop-1080.mp4" type="video/mp4" media="(max-width: 1280px)" />
      <source src="/videos/tier-trade-hero-loop.mp4" type="video/mp4" />
    </video>
  );
}

/** "Ver a operação": opens the hero film full screen, with controls. */
export function WatchVideo({ className }: { className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const open = () => {
    dialogRef.current?.showModal();
    videoRef.current?.play().catch(() => undefined);
  };
  const close = () => {
    videoRef.current?.pause();
    dialogRef.current?.close();
  };
  return (
    <>
      <button type="button" className={className} onClick={open}>
        Ver a operação
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
      </button>
      <dialog ref={dialogRef} className="tt-video-dialog" onClose={() => videoRef.current?.pause()} onClick={(event) => { if (event.target === dialogRef.current) close(); }} aria-label="Filme do Tier Trade">
        <button type="button" className="tt-video-close" onClick={close} aria-label="Fechar vídeo">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
        </button>
        <video ref={videoRef} controls playsInline loop preload="none">
          <source src="/videos/tier-trade-hero-loop-1080.mp4" type="video/mp4" />
        </video>
      </dialog>
    </>
  );
}

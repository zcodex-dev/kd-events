'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Info, ExternalLink, Calendar, MapPin, Tag } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/events';
import { getMediaUrl, isVideo } from '@/lib/media';

type Props = {
  events: PublicEvent[];
};

export function HeroCarousel({ events }: Props) {
  // Prefer active events, fallback to upcoming, or any non-empty list
  const activeEvents = events.filter(
    (e) =>
      e.status?.toUpperCase() === 'ACTIVE' ||
      e.status?.toUpperCase().includes('LIVE') ||
      e.status?.toUpperCase().includes('OPEN')
  );

  const displayEvents = activeEvents.length > 0 ? activeEvents : events.slice(0, 5);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const count = displayEvents.length;

  const handleNext = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const handlePrev = useCallback(() => {
    if (count <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  // Autoplay timer: 6 seconds, pauses on hover or when tab is inactive
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [count, isPaused, handleNext]);

  // Tab visibility pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!displayEvents.length) {
    return (
      <div className="relative w-full pt-28 pb-12 bg-[#101010] flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest text-[#c3943a] font-semibold mb-2">
            Kompong Dewa Events
          </p>
          <h2 className="text-2xl md:text-4xl font-serif text-white mb-3">
            Exciting Events Coming Soon
          </h2>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Stay tuned for our upcoming poker tournaments, baccarat championships, and resort promotions.
          </p>
        </div>
      </div>
    );
  }

  const current = displayEvents[currentIndex];
  const primaryMedia = current.images?.[0] || current.imageUrl || '';
  const mediaSrc = getMediaUrl(primaryMedia);
  const hasVideo = isVideo(mediaSrc);

  // Strip rich text for concise description excerpt, preferring concept
  const rawExcerpt = current.concept || current.description || '';
  const plainDesc = rawExcerpt
    .replace(/<table[\s\S]*?<\/table>/gi, '') // Remove tables entirely from excerpt
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

  return (
    <section
      className="relative w-full pt-20 sm:pt-24 pb-2 sm:pb-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Featured Events Carousel"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="group relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#101010] border border-white/10 min-h-[380px] sm:h-[460px] md:h-[500px] lg:h-[520px] flex flex-col justify-end shadow-2xl">
          {/* Background / Hero Media */}
          <div className="absolute inset-0 w-full h-full bg-black overflow-hidden pointer-events-none">
            {hasVideo ? (
              <video
                key={mediaSrc}
                src={mediaSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-contain object-right opacity-90 transition-opacity duration-700"
              />
            ) : (
              <img
                key={mediaSrc}
                src={mediaSrc || '/kd-picture.webp'}
                alt={current.title}
                className="w-full h-full object-contain object-right opacity-90 transition-opacity duration-700"
              />
            )}

            {/* Seamless Dark Gradient: Solid dark on left for text legibility, feathering to the right */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, #101010 0%, #101010 28%, rgba(16, 16, 16, 0.88) 52%, rgba(16, 16, 16, 0.25) 78%, transparent 100%)',
              }}
            />
            {/* Ambient bottom gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101010] via-[#101010]/30 to-transparent" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 p-5 sm:p-8 md:p-10 max-w-xl md:max-w-2xl space-y-3 sm:space-y-4">
            {/* Badges: Game Tag & Status */}
            <div className="flex flex-wrap items-center gap-2">
              {current.tag && (
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-[#c3943a] text-black rounded">
                  {current.tag}
                </span>
              )}
              <span
                className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded border ${
                  current.status?.toUpperCase() === 'ACTIVE' ||
                  current.status?.toUpperCase().includes('LIVE') ||
                  current.status?.toUpperCase().includes('OPEN')
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                }`}
              >
                {current.status}
              </span>
              {hasVideo && (
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-black/70 text-white rounded border border-white/20">
                  MOTION
                </span>
              )}
            </div>

            {/* Event Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {current.title}
            </h1>

            {/* Date & Location */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-neutral-300">
              {current.date && (
                <div className="flex items-center gap-1.5 text-[#e5ac53] font-medium">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{current.date}</span>
                </div>
              )}
              {current.location && (
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <MapPin className="w-4 h-4 shrink-0 text-neutral-400" />
                  <span>{current.location}</span>
                </div>
              )}
            </div>

            {/* Excerpt Description */}
            {plainDesc && (
              <p className="text-neutral-300 text-xs sm:text-sm line-clamp-2 leading-relaxed drop-shadow-sm max-w-xl">
                {plainDesc}
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <Link
                href={`/events/${getEventSlug(current)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-bold tracking-wide transition-colors shadow-md"
              >
                <Info className="w-4 h-4" />
                <span>View Details</span>
              </Link>

              <a
                href="https://register.kompongdewa.win"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#c3943a] hover:bg-[#e5ac53] text-black text-xs sm:text-sm font-bold tracking-wide transition-colors shadow-md"
              >
                <span>Register Now</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Arrow Controls */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous event slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next event slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all opacity-0 group-hover:opacity-100 z-20 shadow-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Bottom Pagination Indicators */}
              <div className="absolute bottom-5 right-6 md:right-8 flex items-center gap-2 z-20">
                {displayEvents.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`h-1.5 transition-all duration-300 rounded-full ${
                      currentIndex === idx
                        ? 'w-8 bg-[#c3943a]'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/events';
import { getMediaUrl, isVideo } from '@/lib/media';
import { EventCountdown } from '@/components/event-countdown';

type Props = {
  featuredEvent?: PublicEvent | null;
};

export function LandingHero({ featuredEvent }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.95, 0.35]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.985]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -20]);

  const eventSlug = getEventSlug(featuredEvent) || 'baccarat-masters';
  const mediaSrc = getMediaUrl(
    featuredEvent?.images?.[0] ||
      featuredEvent?.imageUrl ||
      'https://kompongdewa.win/api/raw?key=public-uploads%2F2026%2F10%2FBaccarat-Masters_Cover-ANE64_tBJ-.mp4'
  );
  const hasVideo = isVideo(mediaSrc);

  return (
    <motion.section
      ref={heroRef}
      style={{ opacity, scale, y }}
      className="relative w-full select-none bg-[#101010] md:min-h-screen md:flex md:flex-col md:justify-between md:pt-28 md:pb-10 overflow-hidden will-change-transform"
    >
      {/* 
        Background Media Presentation:
        - On Desktop (md:): Absolute full-screen cinematic backdrop (object-cover)
        - On Mobile (< md): In-flow hero banner starting cleanly right under header (pt-16), native aspect ratio (no letterbox black bars or dead voids)
      */}
      <div className="relative md:absolute md:inset-0 w-full overflow-hidden pt-16 md:pt-0">
        <div className="w-full aspect-[2.08/1] md:aspect-auto md:w-full md:h-full relative overflow-hidden bg-black flex items-center justify-center">
          {hasVideo ? (
            <video
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <img
              src={mediaSrc}
              alt={featuredEvent?.title || 'Kompong Dewa Baccarat Masters'}
              className="w-full h-full object-cover object-center"
            />
          )}

          {/* Desktop top fade for header contrast */}
          <div
            className="hidden md:block absolute inset-x-0 top-0 h-28 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, #101010 0%, rgba(16, 16, 16, 0.7) 60%, transparent 100%)',
            }}
          />

          {/* Bottom subtle fade to blend seamlessly into #101010 body background */}
          <div
            className="absolute inset-x-0 bottom-0 h-8 md:h-36 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, #101010 0%, rgba(16, 16, 16, 0.8) 60%, transparent 100%)',
            }}
          />
        </div>
      </div>

      <div className="absolute z-20 top-20 md:top-28 left-4 sm:left-6 lg:left-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#c3943a] px-3.5 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-[#17120a] shadow-lg">
          <span className="h-2 w-2 rounded-full bg-[#17120a]" />
          Upcoming
        </span>
      </div>

      {/* Spacer pushing desktop controls to bottom */}
      <div className="hidden md:flex flex-1" />

      {/* Bottom Actions */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 pt-4 pb-6 md:pt-0 md:pb-0">
        {/* Quick Touch Actions: Rules & Register */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <EventCountdown
            startAt={featuredEvent?.startAt}
            endAt={featuredEvent?.endAt}
            dateStr={featuredEvent?.date}
          />
          <div className="flex w-full sm:w-auto items-center gap-3 sm:gap-4 sm:min-w-[36rem] sm:ml-auto">
          <Link
            href={`/events/${eventSlug}`}
            className="flex-1 min-h-12 sm:min-h-14 inline-flex items-center justify-center gap-2.5 px-5 sm:px-8 py-3 sm:py-4 rounded-lg bg-white hover:bg-neutral-200 text-black text-sm sm:text-base font-bold tracking-wide transition-all shadow-lg active:scale-95 text-center whitespace-nowrap"
          >
            <span>Tournament Rules</span>
            <ArrowRight className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
          </Link>

          <a
            href="https://register.kompongdewa.win"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-h-12 sm:min-h-14 inline-flex items-center justify-center gap-2.5 px-5 sm:px-8 py-3 sm:py-4 rounded-lg bg-[#c3943a] hover:bg-[#e5ac53] text-black text-sm sm:text-base font-bold tracking-wide transition-all shadow-lg active:scale-95 text-center whitespace-nowrap"
          >
            <span>Register Now</span>
            <ExternalLink className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
          </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

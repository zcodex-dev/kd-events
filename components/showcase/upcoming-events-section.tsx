'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/showcase/events';
import { getMediaUrl, isVideo } from '@/lib/showcase/media';
import { EventCountdown } from '@/components/showcase/event-countdown';

type Props = {
  events: PublicEvent[];
  featuredEventId?: string;
};

export function UpcomingEventsSection({ events, featuredEventId }: Props) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const updateReveal = () => {
      setHasScrolled(window.scrollY >= window.innerHeight * 0.35);
    };

    updateReveal();
    window.addEventListener('scroll', updateReveal, { passive: true });
    window.addEventListener('resize', updateReveal);

    return () => {
      window.removeEventListener('scroll', updateReveal);
      window.removeEventListener('resize', updateReveal);
    };
  }, []);

  // Include all published events except the one featured in the main landing hero
  const eventsToShow = events.filter((event) => {
    if (event.id === featuredEventId) return false;
    const status = event.status?.toUpperCase() || '';
    return status !== 'HIDDEN';
  });

  if (eventsToShow.length === 0) return null;

  return (
    <section id="upcoming-events" className="w-full border-t border-white/5 overflow-hidden">
      {/* Cinematic event features */}
      <div className="w-full space-y-10 sm:space-y-14">
        {eventsToShow.map((event) => {
          const mediaSrc = getMediaUrl(event.images?.[0] || event.imageUrl);
          const hasVideo = isVideo(mediaSrc);

          return (
            <motion.article
              key={event.id}
              initial="hidden"
              animate={hasScrolled ? 'visible' : 'hidden'}
              variants={{
                visible: {
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  visibility: 'visible',
                },
                hidden: {
                  opacity: 0,
                  scale: 0.975,
                  y: 32,
                  filter: 'blur(7px)',
                  transitionEnd: { visibility: 'hidden' },
                },
              }}
              transition={{
                opacity: { duration: 1.05, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
                filter: { duration: 0.9, ease: 'easeOut' },
              }}
              className="relative w-full min-h-[58vw] md:min-h-screen overflow-hidden bg-black will-change-transform"
            >
              <div className="absolute inset-0">
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
                    src={mediaSrc || '/kd-picture.webp'}
                    alt={event.title}
                    className="w-full h-full object-cover object-center"
                  />
                )}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#101010] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#101010] via-[#101010]/85 to-transparent" />
                <div className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#101010] to-transparent" />
                <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#101010] to-transparent" />
              </div>

              <div className="absolute z-20 top-5 sm:top-8 left-4 sm:left-6 lg:left-8 flex items-center gap-2">
                {event.status?.toUpperCase().includes('UPCOMING') ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#c3943a] px-3.5 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-black shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-black" />
                    Upcoming
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3.5 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    {event.status || 'Active'}
                  </span>
                )}
                {event.tag && (
                  <span className="inline-flex items-center rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-neutral-200 shadow-md">
                    {event.tag}
                  </span>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-5 sm:bottom-8 z-10 px-4 sm:px-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <EventCountdown
                    startAt={event.startAt}
                    endAt={event.endAt}
                    dateStr={event.date}
                  />
                  <div className="flex w-full sm:w-auto items-center gap-3 sm:gap-4 sm:min-w-[36rem] sm:ml-auto">
                  <Link
                    href={`/events/${getEventSlug(event)}`}
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
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Trophy, ArrowRight } from 'lucide-react';
import type { PublicEvent } from '@/lib/events';
import { EventCard } from './event-card';

type Props = {
  title: string;
  subtitle?: string;
  events: PublicEvent[];
};

export function EventRow({ title, subtitle, events }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [events]);

  const scroll = (direction: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!events.length) return null;

  return (
    <section className="relative py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Row Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#c3943a] uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Official Schedule</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>{title}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#c59a3f]/15 text-[#e5ac53] border border-[#c59a3f]/30">
              {events.length} Events
            </span>
          </h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-1 max-w-xl">{subtitle}</p>}
        </div>

        {/* Right side: View All link + Controls */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <Link
            href="/events"
            className="text-xs font-bold text-[#c59a3f] hover:text-[#e5ac53] flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full border border-[#c59a3f]/25 bg-neutral-950/80 hover:bg-[#c59a3f]/15 hover:border-[#c59a3f]/50 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:text-[#e5ac53] flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full border border-[#c59a3f]/25 bg-neutral-950/80 hover:bg-[#c59a3f]/15 hover:border-[#c59a3f]/50 disabled:opacity-30 disabled:cursor-not-allowed text-white hover:text-[#e5ac53] flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={rowRef}
        onScroll={checkScroll}
        className="flex items-stretch gap-5 overflow-x-auto no-scrollbar smooth-scroll pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

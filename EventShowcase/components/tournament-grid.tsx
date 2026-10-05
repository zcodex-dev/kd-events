'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Trophy, ArrowRight, ExternalLink } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/events';
import { getMediaUrl, isVideo } from '@/lib/media';

type Props = {
  events: PublicEvent[];
};

export function TournamentGrid({ events }: Props) {
  const [activeTag, setActiveTag] = useState<string>('ALL');

  if (!events.length) return null;

  // Extract unique categories
  const categories = ['ALL', 'Baccarat', 'Poker'];

  const filteredEvents =
    activeTag === 'ALL'
      ? events
      : events.filter((e) => e.tag?.toLowerCase() === activeTag.toLowerCase());

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* Section Header & Minimal Category Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Tournament Schedule
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Browse active and upcoming championship tournaments at Kompong Dewa.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2">
          {categories.map((cat) => {
            const isActive = activeTag === cat;
            const count =
              cat === 'ALL'
                ? events.length
                : events.filter((e) => e.tag?.toLowerCase() === cat.toLowerCase()).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveTag(cat)}
                className={`px-3.5 py-1.5 text-xs rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#c3943a] text-black font-bold'
                    : 'bg-[#161616] text-neutral-400 hover:text-white border border-white/10 hover:border-white/25'
                }`}
              >
                <span>{cat === 'ALL' ? 'All Events' : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3-Column Minimal Bento Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredEvents.map((event) => {
          const mediaSrc = getMediaUrl(event.images?.[0] || event.imageUrl);
          const hasVideo = isVideo(mediaSrc);

          const plainDesc = (event.concept || event.description || '')
            .replace(/<table[\s\S]*?<\/table>/gi, '')
            .replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, '')
            .replace(/<p[^>]*>[\s\S]*?(?:Prize|Tournament)\s+Structure[\s\S]*?<\/p>/gi, '')
            .replace(/<p[^>]*>[\s\S]*?TOTAL\s+GUARANTEED[\s\S]*?<\/p>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const prizeMatch = event.description?.match(/TOTAL\s+GUARANTEED\s+PRIZE\s*(?:OF)?\s*([A-Z0-9\$,\.\s]+?)(?:<\/|<br|\n|$)/i);
          const prizeText = prizeMatch ? prizeMatch[1].replace(/<[^>]*>/g, '').trim() : null;

          const isActive =
            event.status?.toUpperCase() === 'ACTIVE' ||
            event.status?.toUpperCase().includes('LIVE') ||
            event.status?.toUpperCase().includes('OPEN');

          return (
            <Link
              key={event.id}
              href={`/events/${getEventSlug(event)}`}
              className="group rounded-xl border border-white/10 bg-[#161616] hover:border-[#c3943a]/50 transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              {/* Media Container */}
              <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
                {hasVideo ? (
                  <video
                    src={mediaSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={mediaSrc || '/kd-picture.webp'}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border backdrop-blur-md flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-black/70 text-emerald-400 border-emerald-500/30'
                        : 'bg-black/70 text-[#e5ac53] border-[#c3943a]/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isActive ? 'bg-emerald-400 animate-pulse' : 'bg-[#e5ac53]'
                      }`}
                    />
                    {event.status}
                  </span>
                </div>

                {/* Game Tag */}
                {event.tag && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-black/70 border border-white/20 text-neutral-200 backdrop-blur-md">
                      {event.tag}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-base font-bold text-white group-hover:text-[#e5ac53] transition-colors line-clamp-1">
                    {event.title}
                  </h4>

                  {/* Date & Location */}
                  <div className="space-y-1 text-xs">
                    {event.date && (
                      <div className="flex items-center gap-1.5 text-[#e5ac53] font-medium truncate">
                        <Calendar className="w-3.5 h-3.5 text-[#c3943a] shrink-0" />
                        <span className="truncate">{event.date}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1.5 text-neutral-400 truncate">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  {plainDesc && (
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed pt-1">
                      {plainDesc}
                    </p>
                  )}
                </div>

                {/* Card Footer Bar */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  {prizeText ? (
                    <div className="inline-flex items-center gap-1.5 text-[#e5ac53] font-bold text-[11px]">
                      <Trophy className="w-3.5 h-3.5 text-[#c3943a] shrink-0" />
                      <span className="truncate">USD {prizeText}</span>
                    </div>
                  ) : (
                    <span className="text-neutral-500 text-[11px]">Tournament Details</span>
                  )}

                  <span className="inline-flex items-center gap-1 text-[#c3943a] font-semibold text-xs group-hover:translate-x-1 transition-transform">
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* VIP Registration & Member Services CTA */}
      <div className="p-6 sm:p-8 rounded-xl border border-white/10 bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <h4 className="text-base font-bold text-white">
            Tournament Registration & Member Services
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Active club members may register directly for all scheduled tournaments. Non-members can pre-register online or enroll with a guest host upon arrival.
          </p>
        </div>

        <a
          href="https://register.kompongdewa.win"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#c3943a] hover:bg-[#e5ac53] text-black text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
        >
          <span>Register Online</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
}

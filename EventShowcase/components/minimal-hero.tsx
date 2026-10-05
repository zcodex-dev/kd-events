'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Trophy, ArrowRight, ExternalLink } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/events';
import { getMediaUrl, isVideo } from '@/lib/media';

type Props = {
  events: PublicEvent[];
};

export function MinimalHero({ events }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!events.length) return null;

  // Prioritize upcoming or active baccarat/poker events
  const current = events[selectedIndex] || events[0];
  const mediaSrc = getMediaUrl(current.images?.[0] || current.imageUrl);
  const hasVideo = isVideo(mediaSrc);

  // Clean plain description excerpt (stripping tables and raw prize ladders)
  const plainText = (current.concept || current.description || '')
    .replace(/<table[\s\S]*?<\/table>/gi, '')
    .replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?(?:Prize|Tournament)\s+Structure[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?TOTAL\s+GUARANTEED[\s\S]*?<\/p>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract guaranteed prize text if present
  const prizeMatch = current.description?.match(/TOTAL\s+GUARANTEED\s+PRIZE\s*(?:OF)?\s*([A-Z0-9\$,\.\s]+?)(?:<\/|<br|\n|$)/i);
  const guaranteedPrize = prizeMatch ? prizeMatch[1].replace(/<[^>]*>/g, '').trim() : null;

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#161616] overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
        {/* Left Column: Content (7 cols on desktop) */}
        <div className="lg:col-span-7 p-6 sm:p-8 md:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header Kicker & Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#c3943a]">
                Featured Tournament
              </span>
              <span className="text-neutral-600">·</span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  current.status?.toUpperCase() === 'ACTIVE' ||
                  current.status?.toUpperCase().includes('LIVE') ||
                  current.status?.toUpperCase().includes('OPEN')
                    ? 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30'
                    : 'text-[#e5ac53] border-[#c3943a]/30 bg-[#22180a]'
                }`}
              >
                {current.status}
              </span>
              {current.tag && (
                <span className="text-[11px] font-semibold text-neutral-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {current.tag}
                </span>
              )}
            </div>

            {/* Event Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {current.title}
            </h2>

            {/* Date & Location Metadata */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm">
              {current.date && (
                <div className="flex items-center gap-2 text-[#e5ac53] font-medium">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{current.date}</span>
                </div>
              )}
              {current.location && (
                <div className="flex items-center gap-2 text-neutral-400">
                  <MapPin className="w-4 h-4 shrink-0 text-neutral-500" />
                  <span>{current.location}</span>
                </div>
              )}
            </div>

            {/* Guaranteed Prize Callout */}
            {guaranteedPrize && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22180a] border border-[#c3943a]/30 text-xs font-semibold text-[#e5ac53]">
                <Trophy className="w-3.5 h-3.5 text-[#c3943a] shrink-0" />
                <span>TOTAL GUARANTEED PRIZE OF {guaranteedPrize}</span>
              </div>
            )}

            {/* Clean Concept / Excerpt */}
            {plainText && (
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed line-clamp-3 max-w-xl">
                {plainText}
              </p>
            )}
          </div>

          {/* Actions & Tab Switcher */}
          <div className="space-y-6 pt-2">
            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/events/${getEventSlug(current)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c3943a] hover:bg-[#e5ac53] text-black text-xs sm:text-sm font-bold tracking-wide transition-colors"
              >
                <span>View Tournament Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://register.kompongdewa.win"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                <span>Register Online</span>
                <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              </a>
            </div>

            {/* Minimal Event Switcher Tabs (clean numbers + title) */}
            {events.length > 1 && (
              <div className="pt-4 border-t border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  {events.map((ev, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedIndex(idx)}
                        className={`text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'bg-white/10 text-white font-semibold border border-white/20'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-[#c3943a]' : 'text-neutral-600'}`}>
                          0{idx + 1}
                        </span>
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
                          {ev.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Media Canvas (5 cols on desktop) */}
        <div className="lg:col-span-5 relative aspect-[16/9] lg:aspect-auto bg-black lg:border-l border-white/10 overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {hasVideo ? (
            <video
              key={mediaSrc}
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <img
              key={mediaSrc}
              src={mediaSrc || '/kd-picture.webp'}
              alt={current.title}
              className="w-full h-full object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}

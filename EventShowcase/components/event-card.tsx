import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Film, ArrowRight, Trophy } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/events';
import { getMediaUrl, isVideo } from '@/lib/media';

type Props = {
  event: PublicEvent;
};

export function EventCard({ event }: Props) {
  const mediaSrc = getMediaUrl(event.images?.[0] || event.imageUrl);
  const hasVideo = isVideo(mediaSrc);

  // Extract guaranteed prize if available in description
  const prizeMatch = event.description?.match(/TOTAL\s+GUARANTEED\s+PRIZE\s*(?:OF)?\s*([A-Z0-9\$,\.\s]+?)(?:<\/|<br|\n|$)/i);
  const prizeText = prizeMatch ? prizeMatch[1].replace(/<[^>]*>/g, '').trim() : null;

  return (
    <Link
      href={`/events/${getEventSlug(event)}`}
      className="group relative flex-none w-[280px] sm:w-[320px] md:w-[350px] rounded-2xl overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#1c160e_0%,#0e0d0b_50%,#060606_100%)] border border-[#c59a3f]/25 hover:border-[#c59a3f]/60 transition-all duration-300 hover:-translate-y-1 block"
    >
      {/* 16:9 Aspect Ratio Media Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-black">
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

        {/* Ambient bottom gradient inside media */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0b] via-transparent to-transparent opacity-90" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {event.tag && (
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#c3943a] text-black rounded">
              {event.tag}
            </span>
          )}
          {hasVideo && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/80 text-white rounded flex items-center gap-1 border border-white/20">
              <Film className="w-2.5 h-2.5" />
              MP4
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 z-10">
          <span
            className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wide rounded border flex items-center gap-1.5 ${
              event.status?.toUpperCase() === 'ACTIVE' ||
              event.status?.toUpperCase().includes('LIVE') ||
              event.status?.toUpperCase().includes('OPEN')
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                : 'bg-neutral-900/90 text-neutral-300 border-neutral-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                event.status?.toUpperCase() === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'
              }`}
            />
            {event.status}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2.5">
        {prizeText && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#c59a3f]/10 border border-[#c59a3f]/25 text-[11px] font-bold text-[#e5ac53]">
            <Trophy className="w-3 h-3 text-[#c59a3f]" />
            <span className="truncate">{prizeText} Guaranteed</span>
          </div>
        )}

        <h3 className="text-base font-bold text-white group-hover:text-[#e5ac53] transition-colors line-clamp-1">
          {event.title}
        </h3>

        {event.date && (
          <div className="flex items-center gap-1.5 text-xs text-[#c3943a]">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.date}</span>
          </div>
        )}

        {event.location && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-neutral-500" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Action Row */}
        <div className="pt-2.5 border-t border-[#c59a3f]/15 flex items-center justify-between text-xs">
          <span className="text-neutral-400 group-hover:text-neutral-200 transition-colors">
            Tournament Details
          </span>
          <span className="text-[#c59a3f] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

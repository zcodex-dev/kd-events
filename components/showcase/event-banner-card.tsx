import Link from 'next/link';
import { Calendar, MapPin, Trophy, ArrowRight, Film } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/showcase/events';
import { getMediaUrl, isVideo } from '@/lib/showcase/media';

type Props = {
  event: PublicEvent;
};

export function EventBannerCard({ event }: Props) {
  const mediaSrc = getMediaUrl(event.images?.[0] || event.imageUrl);
  const hasVideo = isVideo(mediaSrc);

  // Extract guaranteed prize if available in description
  const prizeMatch = event.description?.match(/TOTAL\s+GUARANTEED\s+PRIZE\s*(?:OF)?\s*([A-Z0-9\$,\.\s]+?)(?:<\/|<br|\n|$)/i);
  const prizeText = prizeMatch ? prizeMatch[1].replace(/<[^>]*>/g, '').trim() : null;

  return (
    <Link
      href={`/events/${getEventSlug(event)}`}
      className="group relative w-full rounded-2xl overflow-hidden bg-[radial-gradient(120%_80%_at_50%_0%,#1c160e_0%,#0e0d0b_50%,#060606_100%)] border border-[#c59a3f]/25 hover:border-[#c59a3f]/60 transition-all duration-300 hover:-translate-y-1 min-h-[180px] sm:min-h-[210px] flex items-center shadow-md hover:shadow-xl block"
    >
      {/* Full-Bleed Background Media with Seamless Horizontal Fade */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {hasVideo ? (
          <video
            src={mediaSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover object-right transition-transform duration-700 group-hover:scale-105 opacity-80"
          />
        ) : (
          <img
            src={mediaSrc || '/kd-picture.webp'}
            alt={event.title}
            className="w-full h-full object-cover object-right transition-transform duration-700 group-hover:scale-105 opacity-80"
          />
        )}
        {/* Seamless feather gradient: solid dark on left for text, completely soft fade to right */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, #0d0c0a 0%, #0d0c0a 28%, rgba(13, 12, 10, 0.88) 52%, rgba(13, 12, 10, 0.2) 78%, transparent 100%)',
          }}
        />
      </div>

      {/* Left Content Column */}
      <div className="relative z-10 p-5 sm:p-7 flex-1 max-w-[75%] sm:max-w-[62%] flex flex-col justify-between h-full space-y-3">
        {/* Badges: Tag + Status + MP4 */}
        <div className="flex flex-wrap items-center gap-2">
          {event.tag && (
            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#c3943a] text-black rounded shrink-0">
              {event.tag}
            </span>
          )}
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
          {hasVideo && (
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/80 text-white rounded flex items-center gap-1 border border-white/20">
              <Film className="w-2.5 h-2.5" />
              MP4
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white group-hover:text-[#e5ac53] transition-colors leading-tight line-clamp-2">
          {event.title}
        </h3>

        {/* Metadata: Date & Location */}
        <div className="space-y-1 text-xs sm:text-sm">
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

        {/* Prize Pool & Explore CTA */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#c59a3f]/15 text-xs">
          {prizeText ? (
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e5ac53]">
              <Trophy className="w-3.5 h-3.5 text-[#c3943a]" />
              <span className="truncate">{prizeText}</span>
            </div>
          ) : (
            <span className="text-neutral-400">Tournament Details</span>
          )}

          <span className="text-[#c59a3f] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0">
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

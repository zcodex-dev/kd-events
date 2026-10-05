import Link from 'next/link';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/events';
import { getMediaUrl, isVideo } from '@/lib/media';

type Props = {
  events: PublicEvent[];
};

export function TournamentCalendar({ events }: Props) {
  if (!events.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Left-Aligned Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-wider text-white">
          Tournament Calendar
        </h2>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
        {events.map((event) => {
          const mediaSrc = getMediaUrl(event.images?.[0] || event.imageUrl);
          const hasVideo = isVideo(mediaSrc);

          return (
            <Link
              key={event.id}
              href={`/events/${getEventSlug(event)}`}
              className="group relative rounded-xl overflow-hidden bg-[#121212] border border-white/10 hover:border-[#c59a3f]/50 transition-all duration-300 min-h-[96px] sm:min-h-[105px] flex items-center shadow-sm hover:shadow-md"
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
                    className="w-full h-full object-cover object-right transition-transform duration-500 group-hover:scale-105 opacity-75"
                  />
                ) : (
                  <img
                    src={mediaSrc || '/kd-picture.webp'}
                    alt={event.title}
                    className="w-full h-full object-cover object-right transition-transform duration-500 group-hover:scale-105 opacity-75"
                  />
                )}
                {/* Left-fading dark overlay for text readability without hard edge */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, #121212 0%, #121212 30%, rgba(18, 18, 18, 0.85) 55%, rgba(18, 18, 18, 0.2) 80%, transparent 100%)',
                  }}
                />
              </div>

              {/* Left Content Column */}
              <div className="relative z-10 p-3.5 sm:p-5 flex-1 max-w-[70%] sm:max-w-[65%] space-y-1 sm:space-y-1.5">
                {/* Title with Tag */}
                <div className="flex items-center gap-2">
                  {event.tag && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#c3943a] text-black rounded shrink-0">
                      {event.tag}
                    </span>
                  )}
                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#e5ac53] transition-colors truncate">
                    {event.title}
                  </h3>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#e5ac53] font-medium truncate">
                  <Calendar className="w-3.5 h-3.5 text-[#c3943a] shrink-0" />
                  <span className="truncate">{event.date || 'TBA'}</span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-400 truncate">
                  <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                  <span className="truncate">{event.location || 'Kompong Dewa Resort'}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

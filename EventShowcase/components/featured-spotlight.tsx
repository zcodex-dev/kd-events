import Link from 'next/link';
import { Calendar, MapPin, Trophy, ExternalLink, ArrowRight } from 'lucide-react';
import { getEventSlug, type PublicEvent } from '@/lib/events';
import { getMediaUrl, isVideo } from '@/lib/media';

type Props = {
  event: PublicEvent;
};

export function FeaturedSpotlight({ event }: Props) {
  const mediaSrc = getMediaUrl(event.images?.[0] || event.imageUrl);
  const hasVideo = isVideo(mediaSrc);

  const cleanDescription = (event.concept || event.description || '')
    .replace(/<table[\s\S]*?<\/table>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-6 sm:py-8">
      {/* Featured Card Container */}
      <div className="relative rounded-2xl overflow-hidden flex flex-col lg:flex-row lg:items-center lg:min-h-[440px] bg-[#0d0c0a] border border-[#c59a3f]/25 shadow-xl w-full">
        {/* CC Light Sweep Effect (35% opacity, 5s loop) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          <div
            className="absolute top-0 bottom-0 left-0 w-1/2 animate-light-sweep pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 240, 190, 0.12) 30%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 240, 190, 0.12) 70%, transparent 100%)',
            }}
          />
        </div>

        {/* Mobile Media (fits 2.08:1 banner ratio) */}
        <div className="relative w-full aspect-[2.08/1] sm:aspect-[2/1] lg:hidden bg-black overflow-hidden">
            {hasVideo ? (
              <video
                src={mediaSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={mediaSrc || '/kd-picture.webp'}
                alt={event.title}
                className="w-full h-full object-contain"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a] via-transparent to-black/20 pointer-events-none" />
          </div>

          {/* Desktop Background Media: object-contain object-left so artwork fits without any top/bottom crop */}
          <div className="hidden lg:block absolute inset-0 w-full h-full">
            {hasVideo ? (
              <video
                src={mediaSrc}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain object-left"
              />
            ) : (
              <img
                src={mediaSrc || '/kd-picture.webp'}
                alt={event.title}
                className="w-full h-full object-contain object-left"
              />
            )}
            {/* Desktop Gradient Overlay: Left is transparent to show artwork, Right is solid for text legibility */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, transparent 0%, transparent 32%, rgba(13, 12, 10, 0.75) 50%, #0d0c0a 70%, #0d0c0a 100%)',
              }}
            />
          </div>

          {/* Event Information & Details */}
          <div className="relative z-10 w-full lg:w-1/2 lg:ml-auto p-5 sm:p-7 lg:p-12 space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-[#c3943a] uppercase tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-[#ffd700]" />
                <span>Premier Tournament Feature</span>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {event.title}
              </h2>
            </div>

            <div className="space-y-1 text-xs sm:text-sm text-neutral-300">
              {event.date && (
                <div className="flex items-center gap-2 text-[#e5ac53] font-medium">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{event.date}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-neutral-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {cleanDescription && (
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-3 lg:line-clamp-none max-w-lg">
                {cleanDescription}...
              </p>
            )}

            {/* Action CTAs */}
            <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                href={`/events/${getEventSlug(event)}`}
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 rounded-md bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-bold tracking-wide transition-colors text-center"
              >
                <span>Rules</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>

              <a
                href="https://register.kompongdewa.win"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 rounded-md bg-[#c3943a] hover:bg-[#e5ac53] text-black text-xs sm:text-sm font-bold tracking-wide transition-colors text-center"
              >
                <span>Register</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>
        </div>
    </section>
  );
}

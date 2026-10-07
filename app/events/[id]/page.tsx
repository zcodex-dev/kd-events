import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { fetchEventById } from '@/lib/showcase/events';
import { getMediaUrl, isVideo } from '@/lib/showcase/media';
import { parsePrizePool } from '@/lib/showcase/prize-pool';
import { PrizePoolShowcase } from '@/components/showcase/prize-pool-showcase';
import { EventCountdown } from '@/components/showcase/event-countdown';
import { SetEventLanguage } from '@/components/showcase/set-event-language';
import { EventDetailContent } from '@/components/showcase/event-detail-content';
import { ShowcaseShell } from '@/components/showcase/showcase-shell';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string; embed?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const event = await fetchEventById(id);

  if (!event) return { title: 'Event Not Found — Kompong Dewa Resort' };

  return {
    title: `${event.title} — Kompong Dewa Resort`,
    description: event.description
      ? event.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
      : undefined,
  };
}

function wrapTables(html: string) {
  return html
    .replace(/<table/gi, '<div class="event-table-wrap not-prose"><table')
    .replace(/<\/table>/gi, '</table></div>');
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const isEmbed = sp?.embed === 'true';

  const event = await fetchEventById(id);
  if (!event) notFound();

  const defaultLang = (event.defaultLang as 'en' | 'id' | 'zh') || 'en';
  const currentLang: 'en' | 'id' | 'zh' =
    sp.lang && ['en', 'id', 'zh'].includes(sp.lang)
      ? (sp.lang as 'en' | 'id' | 'zh')
      : defaultLang;

  // Localized text resolution
  const title =
    currentLang === 'id'
      ? event.titleId || event.title
      : currentLang === 'zh'
      ? event.titleZh || event.title
      : event.title;

  const description =
    currentLang === 'id'
      ? event.descriptionId || event.description
      : currentLang === 'zh'
      ? event.descriptionZh || event.description
      : event.description;

  const date =
    currentLang === 'id'
      ? event.dateId || event.date
      : currentLang === 'zh'
      ? event.dateZh || event.date
      : event.date;

  const location =
    currentLang === 'id'
      ? event.locationId || event.location
      : currentLang === 'zh'
      ? event.locationZh || event.location
      : event.location;

  const mediaList = event.images?.length ? event.images : event.imageUrl ? [event.imageUrl] : [];
  const primaryMedia = mediaList[0] || '';
  const mediaSrc = getMediaUrl(primaryMedia);
  const hasVideo = isVideo(mediaSrc);

  return (
    <ShowcaseShell isEmbed={isEmbed}>
      <div className={isEmbed ? 'pt-6 pb-6' : 'pt-20 pb-6 sm:pb-8'}>
        <SetEventLanguage defaultLang={event.defaultLang} />
        {/* Top Breadcrumb Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-4">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Events</span>
          </Link>
        </div>

        {/* Seamless Hero Media blending directly with body background */}
        <div className="relative w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mb-4 sm:mb-6">
          <div className="relative aspect-[16/9] sm:aspect-[2.1/1] w-full overflow-hidden">
            {hasVideo ? (
              <video
                src={mediaSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover sm:object-contain object-center"
              />
            ) : (
              <img
                src={mediaSrc || '/kd-picture.webp'}
                alt={title}
                className="w-full h-full object-cover sm:object-contain object-center"
              />
            )}

            {/* Subtle bottom blend so hero thumbnail is crisp and blends gently into the body */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(to top, #101010 0%, rgba(16, 16, 16, 0.6) 10%, rgba(16, 16, 16, 0.15) 22%, transparent 35%)',
              }}
            />
          </div>
        </div>

        {/* Content Details Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Title & Metadata Header with Countdown on the right side */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10 pb-6">
            <div className="space-y-3 max-w-2xl">
              {event.tag && (
                <div className="inline-block px-2.5 py-0.5 bg-[#c3943a]/20 border border-[#c3943a]/40 rounded text-xs font-bold text-[#e5ac53] uppercase tracking-wider">
                  {event.tag}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-snug">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-neutral-300">
                {date && (
                  <div className="flex items-center gap-2 text-[#e5ac53] font-semibold">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{date}</span>
                  </div>
                )}
                {location && (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <MapPin className="w-4 h-4 shrink-0 text-neutral-500" />
                    <span>{location}</span>
                  </div>
                )}
              </div>
            </div>

            {event.status?.toUpperCase().includes('UPCOMING') && (
              <div className="w-full md:w-auto flex justify-center md:justify-end shrink-0 pt-2 md:pt-0">
                <EventCountdown startAt={event.startAt} endAt={event.endAt} dateStr={date} />
              </div>
            )}
          </div>

          {/* Concept / Highlight */}
          {event.concept && (
            <div className="p-5 rounded-xl bg-neutral-900/60 border border-[#c3943a]/30 text-neutral-200 text-sm leading-relaxed">
              <span className="font-bold text-[#c3943a] block text-xs uppercase tracking-wider mb-1">
                Event Concept
              </span>
              {event.concept}
            </div>
          )}

          {/* Event Content Details (Image Poster / Rich Text) */}
          <EventDetailContent description={description} title={title} />

          {/* Gallery if event has multiple images */}
          {mediaList.length > 1 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-base font-bold text-white">Event Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaList.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/10"
                  >
                    <img
                      src={getMediaUrl(img)}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registration CTA Card */}
          <div className="p-6 md:p-8 rounded-2xl bg-[radial-gradient(120%_80%_at_50%_0%,#1c160e_0%,#0e0d0b_50%,#060606_100%)] border border-[#c59a3f]/25 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-white">Ready to Participate?</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-md">
                Registration is open for active members. Non-members can pre-register online or visit the VIP services desk on arrival.
              </p>
            </div>
            <Link
              href={`/event/registration?eventId=${event.id}`}
              className="px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-black bg-[#c3943a] hover:bg-[#e5ac53] rounded-md transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Register Now</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </ShowcaseShell>
  );
}

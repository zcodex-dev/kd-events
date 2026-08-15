import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { prisma } from '@/lib/prisma';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop';

type PageProps = { params: Promise<{ id: string }> };

/** Rows saved before the `images` array only carry `imageUrl`. */
function eventImages(event: { images?: string[] | null; imageUrl?: string | null }): string[] {
  if (event.images?.length) return event.images;
  return event.imageUrl ? [event.imageUrl] : [];
}

/** Tables need their own scroll container so wide ones don't push the page sideways. */
function wrapTables(html: string) {
  return html
    .replace(/<table/gi, '<div class="event-table-wrap"><table')
    .replace(/<\/table>/gi, '</table></div>');
}

async function getEvent(id: string) {
  try {
    return await prisma.event.findFirst({ where: { id, status: { in: ['ACTIVE', 'UPCOMING'] } } });
  } catch (error) {
    console.error('Failed to load event:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) return { title: 'Event not found' };

  return {
    title: event.title,
    description: event.description
      ? event.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
      : undefined,
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const images = eventImages(event);
  const [cover, ...gallery] = images;

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-black backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="py-1">
            <Image
              src="/logo-v2.png"
              alt="Kompong Dewa Logo"
              width={200}
              height={48}
              className="h-10 w-auto shrink-0 object-contain"
              unoptimized
              priority
            />
          </div>
          <Link
            href="/event/registration"
            className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-neutral-300 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="min-h-screen bg-[#0b0b0b] pt-16 pb-16">
        {/* Cover */}
        <div className="relative h-[38dvh] md:h-[52dvh] bg-black overflow-hidden">
          <Image
            src={cover || FALLBACK_IMAGE}
            alt=""
            fill
            className="object-cover opacity-60"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 max-w-4xl mx-auto px-6 md:px-8 pb-6 md:pb-10">
            {event.tag && (
              <div className="inline-block px-2 py-0.5 md:py-1 mb-3 bg-white/10 backdrop-blur-md rounded text-[10px] md:text-xs font-medium text-[#e5ac53] border border-white/10">
                {event.tag}
              </div>
            )}
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-lg">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 md:px-8">
          {/* Meta */}
          {(event.date || event.location) && (
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 py-5 border-b border-white/10 text-xs md:text-sm text-neutral-300 font-medium">
              {event.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c3943a] shrink-0" />
                  {event.date}
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c3943a] shrink-0" />
                  {event.location}
                </div>
              )}
            </div>
          )}

          {/* Description. Events created before the rich-text editor hold plain
              text, whose line breaks would collapse if rendered as HTML. */}
          <article className="py-6 text-sm md:text-base text-neutral-300 leading-relaxed">
            {!event.description ? (
              <p className="text-neutral-500">No further details have been published for this event yet.</p>
            ) : /<\/?[a-z][\s\S]*>/i.test(event.description) ? (
              <div
                className="event-prose prose prose-sm prose-invert prose-p:text-sm prose-li:text-sm prose-li:marker:text-[#c3943a] max-w-none break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: wrapTables(event.description) }}
              />
            ) : (
              <p className="whitespace-pre-line">{event.description}</p>
            )}
          </article>

          {gallery.length > 0 && (
            <div className="pb-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/40 border border-white/10"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/event/registration?eventId=${event.id}`}
            className="inline-flex items-center justify-center w-full md:w-auto md:px-10 bg-[#c3943a] hover:bg-[#e5ac53] text-white text-sm md:text-base font-bold py-3 md:py-3.5 px-4 rounded-lg shadow-md transition-colors"
          >
            Register for this event
          </Link>
        </div>
      </main>
    </>
  );
}

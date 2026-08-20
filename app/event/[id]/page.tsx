import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { prisma } from '@/lib/prisma';

import { LocalizedEventDetails } from '@/components/event/localized-details';

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
        <LocalizedEventDetails 
          event={event} 
          cover={cover || FALLBACK_IMAGE}
          gallery={gallery}
        />
      </main>
    </>
  );
}

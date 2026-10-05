import { fetchPublishedEvents, type PublicEvent } from '@/lib/showcase/events';
import { EventBannerCard } from '@/components/showcase/event-banner-card';
import { ShowcaseShell } from '@/components/showcase/showcase-shell';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

export const revalidate = 30;

type Props = {
  searchParams?: Promise<{ tag?: string }>;
};

export default async function EventsCatalogPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const currentTag = sp.tag || 'ALL';
  const allEvents = await fetchPublishedEvents();

  const filteredEvents =
    currentTag === 'ALL'
      ? allEvents
      : allEvents.filter((e: PublicEvent) => e.tag?.toLowerCase() === currentTag.toLowerCase());

  const categories = ['ALL', 'Baccarat', 'Poker'];

  return (
    <ShowcaseShell>
      <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title & Filter Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#c3943a] font-bold mb-1">
              Kompong Dewa Events Directory
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Published Events & Tournaments
            </h1>
            <p className="text-sm text-neutral-400 mt-2 max-w-xl">
              Browse active tournaments, upcoming casino championships, and ongoing promotions at Kompong Dewa Resort.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = currentTag.toLowerCase() === cat.toLowerCase();
              return (
                <Link
                  key={cat}
                  href={cat === 'ALL' ? '/events' : `/events?tag=${cat}`}
                  className={`px-4 py-2 text-xs font-semibold rounded-md border transition-all ${
                    isActive
                      ? 'bg-[#c3943a] text-black border-[#c3943a]'
                      : 'bg-neutral-900 text-neutral-300 border-white/10 hover:border-white/30'
                  }`}
                >
                  {cat === 'ALL' ? 'All Events' : cat}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Grid of Event Cards */}
        {filteredEvents.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl bg-neutral-950/40">
            <Calendar className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Events Found</h3>
            <p className="text-sm text-neutral-400 mt-1">
              There are currently no published events in this category.
            </p>
            <Link
              href="/events"
              className="inline-block mt-4 text-xs font-semibold text-[#c3943a] hover:underline"
            >
              View All Events →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {filteredEvents.map((event: PublicEvent) => (
              <EventBannerCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </ShowcaseShell>
  );
}

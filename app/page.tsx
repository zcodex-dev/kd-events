import { fetchPublishedEvents } from '@/lib/showcase/events';
import { LandingHero } from '@/components/showcase/landing-hero';
import { UpcomingEventsSection } from '@/components/showcase/upcoming-events-section';
import { ShowcaseShell } from '@/components/showcase/showcase-shell';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await fetchPublishedEvents();

  // The top event following the configured admin order is the featured hero
  const featuredEvent = events[0] || null;

  return (
    <ShowcaseShell>
      <div className="bg-[#101010] text-[#f3f3f3]">
        {/* 1. Big Single Landing Page Hero */}
        <LandingHero featuredEvent={featuredEvent} />

        {/* 2. Upcoming Events Section on Scroll Down */}
        <UpcomingEventsSection events={events} featuredEventId={featuredEvent?.id} />
      </div>
    </ShowcaseShell>
  );
}

import { fetchPublishedEvents } from '@/lib/events';
import { LandingHero } from '@/components/landing-hero';
import { UpcomingEventsSection } from '@/components/upcoming-events-section';

export const dynamic = 'force-dynamic';

export default async function ShowcaseHomePage() {
  const events = await fetchPublishedEvents();

  // Find the featured flagship tournament (prefer Baccarat Masters)
  const featuredEvent =
    events.find((e) => e.tag?.toLowerCase() === 'baccarat' && e.status?.toUpperCase().includes('UPCOMING')) ||
    events.find((e) => e.status?.toUpperCase().includes('UPCOMING')) ||
    events[0];

  return (
    <div className="bg-[#101010] text-[#f3f3f3]">
      {/* 1. Big Single Landing Page Hero */}
      <LandingHero featuredEvent={featuredEvent} />

      {/* 2. Upcoming Events Section on Scroll Down */}
      <UpcomingEventsSection events={events} featuredEventId={featuredEvent?.id} />
    </div>
  );
}

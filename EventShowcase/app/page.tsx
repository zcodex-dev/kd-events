import { fetchPublishedEvents } from '@/lib/events';
import { LandingHero } from '@/components/landing-hero';
import { UpcomingEventsSection } from '@/components/upcoming-events-section';

export const dynamic = 'force-dynamic';

export default async function ShowcaseHomePage() {
  const events = await fetchPublishedEvents();

  // The top event following the configured admin order is the featured hero
  const featuredEvent = events[0] || null;

  return (
    <div className="bg-[#101010] text-[#f3f3f3]">
      {/* 1. Big Single Landing Page Hero */}
      <LandingHero featuredEvent={featuredEvent} />

      {/* 2. Upcoming Events Section on Scroll Down */}
      <UpcomingEventsSection events={events} featuredEventId={featuredEvent?.id} />
    </div>
  );
}

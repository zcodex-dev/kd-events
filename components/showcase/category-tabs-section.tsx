'use client';

import { useState } from 'react';
import type { PublicEvent } from '@/lib/showcase/events';
import { EventCard } from './event-card';

type Props = {
  events: PublicEvent[];
};

export function CategoryTabsSection({ events }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'Baccarat' | 'Poker'>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Events' },
    { id: 'Baccarat', label: 'Baccarat Championships' },
    { id: 'Poker', label: 'Poker Progressive Jackpots' },
  ] as const;

  const filteredEvents =
    selectedCategory === 'ALL'
      ? events
      : events.filter(
          (e) =>
            e.tag?.toLowerCase() === selectedCategory.toLowerCase() ||
            e.title.toLowerCase().includes(selectedCategory.toLowerCase())
        );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header with Category Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Discover by Category
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Filter our published gaming events and tournament formats
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 p-1 rounded-lg self-start sm:self-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#c3943a] text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

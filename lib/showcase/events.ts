export type PublicEvent = {
  id: string;
  title: string;
  description: string | null;
  titleZh?: string | null;
  descriptionZh?: string | null;
  titleId?: string | null;
  descriptionId?: string | null;
  date: string | null;
  startAt?: string | null;
  endAt?: string | null;
  dateZh?: string | null;
  dateId?: string | null;
  location: string | null;
  locationZh?: string | null;
  locationId?: string | null;
  concept?: string | null;
  conceptZh?: string | null;
  conceptId?: string | null;
  defaultLang?: string | null;
  images: string[];
  imageUrl: string | null;
  telegramImageUrl?: string | null;
  tag: string | null;
  status: string;
  orderIndex: number;
  createdAt: string;
  updatedAt?: string;
};

// Fallback data mirrored from live database to ensure reliable offline & local rendering
const FALLBACK_EVENTS: PublicEvent[] = [
  {
    id: "cmsrimw3g00007uq021fhprej",
    title: "Poker High Hand Progressive Jackpot",
    description: "<p>The High Hand Progressive Jackpot is an ongoing poker promotion designed to reward players who achieve the highest qualifying poker hands during designated promotional periods. The jackpot begins with a guaranteed base amount of USD300 and continues to grow as a percentage of the daily poker rake (30%) allocated to the progressive jackpot fund.</p>",
    date: "Every Friday–Sunday · 18:00–02:00 · Starting August 7, 2026",
    location: "Casino, 1st Floor - Kompong Dewa Resort",
    concept: "Drive gaming floor revenue in a low-traffic window, strengthen KDIR and tenants' relationship, and reward player loyalty with real cash prizes.",
    tag: "Poker",
    status: "ACTIVE",
    orderIndex: 0,
    defaultLang: "en",
    images: ["https://kompongdewa.win/api/raw?key=public-uploads%2F2026%2F08%2FPkV703J-OgROx_8NL_.jpeg"],
    imageUrl: "https://kompongdewa.win/api/raw?key=public-uploads%2F2026%2F08%2FPkV703J-OgROx_8NL_.jpeg",
    createdAt: "2026-08-13T12:50:01.969Z"
  },
  {
    id: "cmumgmmqd0002rqmm5xc2lop8",
    title: "Kompong Dewa Baccarat Masters",
    description: "<p>Exclusive high-stakes Baccarat tournament hosted at the prestigious VIP salon. Elite players compete for cash chips and title honors.</p>",
    date: "Coming Soon · October 2026",
    location: "VIP Gaming Hall, Kompong Dewa Resort",
    concept: "Flagship luxury baccarat gathering featuring elevated table maximums and bespoke guest hospitality.",
    tag: "Baccarat",
    status: "UPCOMING",
    orderIndex: 1,
    defaultLang: "en",
    images: ["https://kompongdewa.win/api/raw?key=public-uploads%2F2026%2F10%2FBaccarat-Masters_Cover-ANE64_tBJ-.mp4"],
    imageUrl: "https://kompongdewa.win/api/raw?key=public-uploads%2F2026%2F10%2FBaccarat-Masters_Cover-ANE64_tBJ-.mp4",
    createdAt: "2026-09-28T10:00:00.000Z"
  },
  {
    id: "cmssgbusm0000xtp3fz3xw0t5",
    title: "Kompong Dewa Baccarat Royale",
    description: "<p>GUARANTEED TO WIN BIG… WITH MORE UP FOR GRABS! Total guaranteed prize pool of USD 5,000 for top baccarat contenders.</p>",
    date: "28 - 30 August 2026",
    location: "Casino Main Hall, 1st Floor",
    concept: "Baccarat tournament anchored to the summer festival with grand trophy presentation.",
    tag: "Baccarat",
    status: "Previous Event",
    orderIndex: 2,
    defaultLang: "en",
    images: ["https://kompongdewa.win/api/raw?key=public-uploads%2F2026%2F08%2FWeb-Banner-xGjcBU9d7j.webp"],
    imageUrl: "https://kompongdewa.win/api/raw?key=public-uploads%2F2026%2F08%2FWeb-Banner-xGjcBU9d7j.webp",
    createdAt: "2026-08-14T08:00:00.000Z"
  }
];

import { prisma } from '@/lib/prisma';

export async function fetchPublishedEvents(): Promise<PublicEvent[]> {
  try {
    const dbEvents = await prisma.event.findMany({
      where: {
        status: {
          not: 'HIDDEN',
        },
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    if (dbEvents && dbEvents.length > 0) {
      return dbEvents.map((ev: any) => ({
        ...ev,
        startAt: ev.startAt ? ev.startAt.toISOString() : null,
        endAt: ev.endAt ? ev.endAt.toISOString() : null,
        createdAt: ev.createdAt ? ev.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: ev.updatedAt ? ev.updatedAt.toISOString() : undefined,
        images: Array.isArray(ev.images) && ev.images.length > 0
          ? ev.images
          : (ev.imageUrl ? [ev.imageUrl] : []),
      }));
    }
  } catch (err) {
    // If database direct connection is unavailable, fallback to API
  }

  const candidateUrls: string[] = [];
  if (process.env.EVENTS_API_URL) {
    candidateUrls.push(process.env.EVENTS_API_URL);
  }
  // In dev, try local backend first if available
  if (process.env.NODE_ENV === 'development') {
    candidateUrls.push('http://localhost:3000/api/events');
  }
  // Production live backend (where admin saves changes)
  candidateUrls.push('https://kompongdewa.win/api/events');

  for (const apiUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(apiUrl, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          return json.data.filter((e: PublicEvent) => e.status?.toUpperCase() !== 'HIDDEN');
        }
      }
    } catch {
      // Try next candidate URL
    }
  }

  return FALLBACK_EVENTS;
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/^kompong\s+dewa\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getEventSlug(event?: PublicEvent | { id: string; title: string } | null): string {
  if (!event) return '';
  const slug = slugifyTitle(event.title);
  return slug || event.id;
}

export async function fetchEventByIdOrSlug(identifier: string): Promise<PublicEvent | null> {
  const events = await fetchPublishedEvents();
  const lower = decodeURIComponent(identifier).toLowerCase().trim();

  return (
    events.find((e) => {
      if (e.id === identifier) return true;
      if (getEventSlug(e) === lower) return true;
      const fullSlug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      if (fullSlug === lower) return true;
      return false;
    }) || null
  );
}

export const fetchEventById = fetchEventByIdOrSlug;

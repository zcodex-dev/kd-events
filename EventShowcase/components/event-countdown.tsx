'use client';

import { useEffect, useState } from 'react';

type Props = {
  startAt?: string | null;
  endAt?: string | null;
  dateStr?: string | null;
  className?: string;
};

type TimeLeft = {
  label: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function calculateTimeLeft(
  startAt?: string | null,
  endAt?: string | null,
  dateStr?: string | null
): TimeLeft | null {
  const now = Date.now();
  let start = startAt ? new Date(startAt).getTime() : Number.NaN;
  let end = endAt ? new Date(endAt).getTime() : Number.NaN;

  if (!Number.isFinite(start) && dateStr) {
    const parts = dateStr.split(/[–—\-]/);
    if (parts[0]) {
      const parsedStart = new Date(parts[0].trim()).getTime();
      if (Number.isFinite(parsedStart)) start = parsedStart;
    }
    if (parts[1]) {
      const parsedEnd = new Date(parts[1].trim()).getTime();
      if (Number.isFinite(parsedEnd)) end = parsedEnd;
    }
  }

  // Fallback for Baccarat Masters October 2026 tournament if raw dates aren't parsed
  if (!Number.isFinite(start) && !Number.isFinite(end)) {
    if (dateStr?.toLowerCase().includes('october') || !dateStr) {
      start = new Date('2026-10-21T18:00:00+07:00').getTime();
    }
  }

  const target = Number.isFinite(start) && now < start ? start : end;
  const label = Number.isFinite(start) && now < start ? 'Starts in' : 'Ends in';

  if (!Number.isFinite(target) || target <= now) return null;

  const totalSeconds = Math.floor((target - now) / 1000);
  return {
    label,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function EventCountdown({ startAt, endAt, dateStr, className = '' }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const update = () => setTimeLeft(calculateTimeLeft(startAt, endAt, dateStr));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [startAt, endAt, dateStr]);

  if (!timeLeft) return null;

  const units = [
    ['Days', timeLeft.days],
    ['Hours', timeLeft.hours],
    ['Min', timeLeft.minutes],
    ['Sec', timeLeft.seconds],
  ] as const;

  return (
    <div className={`w-full text-center sm:w-auto sm:text-left text-white drop-shadow-lg ${className}`}>
      <p className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-[#e5ac53]">
        {timeLeft.label}
      </p>
      <div className="flex items-end justify-center sm:justify-start gap-5 sm:gap-6">
        {units.map(([label, value]) => (
          <div key={label} className="min-w-11 sm:min-w-14">
            <span className="block text-3xl sm:text-4xl font-black tabular-nums leading-none">
              {String(value).padStart(2, '0')}
            </span>
            <span className="mt-1.5 block text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

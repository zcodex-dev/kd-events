'use client';

import { useState, useEffect } from 'react';

type Props = {
  weeklyPrize?: string;
  paidOverall?: string;
  className?: string;
};

export function DrawStatCards({
  weeklyPrize = '$1350',
  paidOverall = '$1144624',
  className = '',
}: Props) {
  // Live ticking countdown timer for realistic excitement
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 21,
    minutes: 46,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return { days: 4, hours: 21, minutes: 46, seconds: 18 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatCountdown = () => {
    const d = String(timeLeft.days).padStart(2, '0');
    const h = String(timeLeft.hours).padStart(2, '0');
    const m = String(timeLeft.minutes).padStart(2, '0');
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-4xl mx-auto select-none ${className}`}>
      {/* Card 1: Weekly Draw Prizes */}
      <div className="relative rounded-2xl bg-[#11041f] border border-white/10 hover:border-purple-400/30 transition-all duration-300 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg shadow-black/40 overflow-hidden group">
        {/* Left Badge: Lottery Tickets */}
        <div className="shrink-0">
          <img
            src="/assets/stat-badge-tickets.png"
            alt="Weekly Draw"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain"
          />
        </div>

        {/* Center Content */}
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide block">
            Weekly Draw Prizes
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#00df59] tracking-tight leading-tight my-0.5">
            {weeklyPrize}
          </div>
          <div className="text-[11px] sm:text-xs text-neutral-400 truncate">
            Next Draw in{' '}
            <span className="text-[#f59e0b] font-semibold">
              {formatCountdown()}
            </span>
          </div>
        </div>

        {/* Right Graphic: Lottery Balls */}
        <div className="shrink-0 self-center">
          <img
            src="/assets/stat-lottery-balls.png"
            alt="Lottery Balls"
            className="h-11 sm:h-13 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Card 2: Paid Overall with Coin Machine */}
      <div className="relative rounded-2xl bg-[#11041f] border border-white/10 hover:border-purple-400/30 transition-all duration-300 p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg shadow-black/40 overflow-hidden group">
        {/* Left Badge: Championship Trophy */}
        <div className="shrink-0">
          <img
            src="/assets/stat-badge-trophy.png"
            alt="Paid Overall"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-contain"
          />
        </div>

        {/* Center Content */}
        <div className="flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide block">
            Paid Overall
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#00df59] tracking-tight leading-tight my-0.5">
            {paidOverall}
          </div>
          <div className="text-[11px] sm:text-xs text-neutral-400 truncate">
            Overall Winnings{' '}
            <span className="text-[#f59e0b] font-semibold">
              paid to players
            </span>
          </div>
        </div>

        {/* Right Graphic: Cash Dispenser Machine with Gold Coins */}
        <div className="shrink-0 self-center">
          <img
            src="/assets/stat-coin-machine.png"
            alt="Coin Machine"
            className="h-13 sm:h-15 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
}

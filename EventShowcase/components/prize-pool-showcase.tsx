'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import { PrizeItem, PrizePoolData } from '@/lib/prize-pool';

export { parsePrizePool } from '@/lib/prize-pool';
export type { PrizeItem, PrizePoolData };

function TrophyWithSweep({
  src,
  alt,
  className,
  delay = '0s',
}: {
  src: string;
  alt: string;
  className: string;
  delay?: string;
}) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Base Trophy Graphic */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain select-none"
      />

      {/* Alpha-Masked CC Light Sweep */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{
          WebkitMaskImage: `url('${src}')`,
          maskImage: `url('${src}')`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 animate-trophy-sweep pointer-events-none"
          style={{
            animationDelay: delay,
            background:
              'linear-gradient(105deg, transparent 20%, rgba(255, 245, 200, 0.25) 38%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 245, 200, 0.25) 62%, transparent 80%)',
            mixBlendMode: 'screen',
          }}
        />
      </div>
    </div>
  );
}

export function PrizePoolShowcase({ data }: { data: PrizePoolData }) {
  const { sectionTitle, totalGuaranteed, prizes, note } = data;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Safety fallback: reveal after 600ms if observer didn't trigger
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const champion = prizes.find((p) => p.placeNumber === 1);
  const second = prizes.find((p) => p.placeNumber === 2);
  const third = prizes.find((p) => p.placeNumber === 3);
  const others = prizes.filter((p) => p.placeNumber > 3);

  // Dynamic geometry for N items in others
  const othersCount = others.length;
  const columnCenters = others.map((_, idx) => ((idx + 0.5) / othersCount) * 1000);
  const minX = columnCenters[0] ?? 100;
  const maxX = columnCenters[othersCount - 1] ?? 900;
  const centerX = 500;
  const leftBarLength = Math.max(10, centerX - minX);
  const rightBarLength = Math.max(10, maxX - centerX);

  return (
    <div ref={containerRef} className="my-8 space-y-6 sm:space-y-8">
      {/* Clean Typography Header — Pure text without clumsy card box */}
      <div
        className="text-center space-y-1.5 pt-2 pb-2 transition-all duration-700 ease-out"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        {sectionTitle && (
          <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[#c3943a] font-bold">
            {sectionTitle}
          </p>
        )}
        <h3
          className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight inline-block bg-gradient-to-b from-[#f3bf6b] to-[#c29337] bg-clip-text text-transparent"
          style={{
            backgroundImage: 'linear-gradient(180deg, #f3bf6b 0%, #c29337 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {totalGuaranteed}
        </h3>
      </div>

      <div className="flex flex-col gap-6 lg:gap-0">
        {/* Top 3 Podium Tier — Strictly 1 Row Across Mobile & Desktop */}
        {(champion || second || third) && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-end w-full relative">
            {/* 2nd Prize — Reveals 2nd (z-10 on top of lines) */}
            {second && (
              <div
                className="order-1 relative z-10 p-2.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-[radial-gradient(120%_80%_at_50%_0%,#18140e_0%,#0e0d0b_50%,#070707_100%)] border border-[#c59a3f]/20 text-center flex flex-col items-center justify-center space-y-1.5 sm:space-y-3 transition-all duration-700 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: isVisible ? '380ms' : '0ms',
                }}
              >
                <TrophyWithSweep
                  src="/assets/trophy/2.svg"
                  alt={second.rank}
                  delay="0s"
                  className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20"
                />
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {second.rank}
                  </div>
                  <div className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                    {second.amount}
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place / Champion (Big Centerpiece) — Reveals 1st */}
            {champion && (
              <div className="order-2 relative flex flex-col justify-end">
                {/* Stepped bracket connector left to 2nd Prize (aligned with user drawing at pedestal level) */}
                <div className="hidden sm:block absolute -left-4 md:-left-6 top-[48%] w-4 md:w-6 h-10 pointer-events-none overflow-visible z-0">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 103 10 H 50 V 90 H -3"
                      stroke="#c3943a"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="186"
                      strokeDashoffset={isVisible ? 0 : 186}
                      style={{
                        transition: 'stroke-dashoffset 450ms cubic-bezier(0.4, 0, 0.2, 1) 1600ms',
                      }}
                    />
                  </svg>
                </div>

                {/* Stepped bracket connector right to 3rd Prize (aligned with user drawing at pedestal level) */}
                <div className="hidden sm:block absolute -right-4 md:-right-6 top-[48%] w-4 md:w-6 h-10 pointer-events-none overflow-visible z-0">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M -3 10 H 50 V 90 H 103"
                      stroke="#c3943a"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="186"
                      strokeDashoffset={isVisible ? 0 : 186}
                      style={{
                        transition: 'stroke-dashoffset 450ms cubic-bezier(0.4, 0, 0.2, 1) 1600ms',
                      }}
                    />
                  </svg>
                </div>

                {/* Champion Card Body (z-10 on top of lines with Animated Golden Gradient Border) */}
                <div
                  className="relative z-10 p-[1.5px] rounded-xl sm:rounded-2xl animate-gold-border transition-all duration-700 ease-out"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.94)',
                    transitionDelay: isVisible ? '150ms' : '0ms',
                  }}
                >
                  <div className="w-full h-full p-3 sm:p-6 md:p-8 rounded-[11px] sm:rounded-[15px] bg-[radial-gradient(120%_80%_at_50%_0%,#22190e_0%,#12100c_50%,#080808_100%)] text-center flex flex-col items-center justify-center space-y-2 sm:space-y-4">
                    <TrophyWithSweep
                      src="/assets/trophy/1st.svg"
                      alt={champion.rank}
                      delay="0.25s"
                      className="w-14 h-14 sm:w-22 sm:h-22 md:w-28 md:h-28"
                    />
                    <div className="space-y-1 sm:space-y-1.5">
                      <div className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] text-[#e5ac53]">
                        {champion.rank}
                      </div>
                      <div className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight animate-gold-shine">
                        {champion.amount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Prize — Reveals 3rd (z-10 on top of lines) */}
            {third && (
              <div
                className="order-3 relative z-10 p-2.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-[radial-gradient(120%_80%_at_50%_0%,#18140e_0%,#0e0d0b_50%,#070707_100%)] border border-[#c59a3f]/20 text-center flex flex-col items-center justify-center space-y-1.5 sm:space-y-3 transition-all duration-700 ease-out"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: isVisible ? '500ms' : '0ms',
                }}
              >
                <TrophyWithSweep
                  src="/assets/trophy/3.svg"
                  alt={third.rank}
                  delay="0.5s"
                  className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20"
                />
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {third.rank}
                  </div>
                  <div className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                    {third.amount}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tournament Tree Bracket Connector: Active on Desktop (lg: 5 columns) at z-0 behind cards */}
        {/* Seamless zero-gap connection directly from Champion's bottom border into 4th-8th cards */}
        {others.length > 0 && (
          <div className="hidden lg:block relative z-0 w-full h-16 pointer-events-none select-none">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 1000 64"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* 1. Center stem: starts at y=-4 (physically overlapping Champion bottom border) down to horizontal bar at y=32 */}
              <line
                x1={centerX}
                y1="-4"
                x2={centerX}
                y2="32"
                stroke="#c3943a"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeDasharray="36"
                strokeDashoffset={isVisible ? 0 : 36}
                style={{
                  transition: 'stroke-dashoffset 350ms cubic-bezier(0.4, 0, 0.2, 1) 1600ms',
                }}
              />

              {/* 2. Horizontal bus bar left branch (from center to minX) */}
              <line
                x1={centerX}
                y1="32"
                x2={minX}
                y2="32"
                stroke="#c3943a"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeDasharray={leftBarLength}
                strokeDashoffset={isVisible ? 0 : leftBarLength}
                style={{
                  transition: 'stroke-dashoffset 400ms cubic-bezier(0.4, 0, 0.2, 1) 1950ms',
                }}
              />

              {/* 3. Horizontal bus bar right branch (from center to maxX) */}
              <line
                x1={centerX}
                y1="32"
                x2={maxX}
                y2="32"
                stroke="#c3943a"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeDasharray={rightBarLength}
                strokeDashoffset={isVisible ? 0 : rightBarLength}
                style={{
                  transition: 'stroke-dashoffset 400ms cubic-bezier(0.4, 0, 0.2, 1) 1950ms',
                }}
              />

              {/* 4. Drop stems: from horizontal bar (y=32) down to y=68 (overlapping top border of each card) */}
              {columnCenters.map((x, idx) => (
                <line
                  key={`drop-${idx}`}
                  x1={x}
                  y1="32"
                  x2={x}
                  y2="68"
                  stroke="#c3943a"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeDasharray="36"
                  strokeDashoffset={isVisible ? 0 : 36}
                  style={{
                    transition: 'stroke-dashoffset 320ms cubic-bezier(0.4, 0, 0.2, 1) 2350ms',
                  }}
                />
              ))}

              {/* 5. Clean Solid Junction Nodes along the bus bar (No glow) */}
              {/* Center node */}
              <circle
                cx={centerX}
                cy="32"
                r="2.5"
                fill="#e5ac53"
                style={{
                  transform: isVisible ? 'scale(1)' : 'scale(0)',
                  transformOrigin: `${centerX}px 32px`,
                  transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1) 1950ms',
                }}
              />

              {/* Column junction nodes */}
              {columnCenters.map((x, idx) => {
                const distFromCenter = Math.abs(x - centerX);
                const dotDelay = 1950 + Math.round((distFromCenter / 400) * 380);
                return (
                  <circle
                    key={`dot-${idx}`}
                    cx={x}
                    cy="32"
                    r="2.5"
                    fill="#e5ac53"
                    style={{
                      transform: isVisible ? 'scale(1)' : 'scale(0)',
                      transformOrigin: `${x}px 32px`,
                      transition: `transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1) ${dotDelay}ms`,
                    }}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* 4th to 8th Ladder Grid — Reveals in order (4, 5, 6, 7, 8) at z-10 on top of lines */}
        {others.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            {others.map((item, idx) => {
              const isOddLast = others.length % 2 !== 0 && idx === others.length - 1;
              const cardDelay = 650 + idx * 120; // 4th at 650ms, 5th at 770ms, 6th at 890ms, 7th at 1010ms, 8th at 1130ms

              return (
                <div
                  key={idx}
                  className={
                    isOddLast
                      ? 'col-span-2 flex justify-center sm:col-span-1 sm:block lg:col-span-1'
                      : 'col-span-1'
                  }
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'opacity 600ms ease-out, transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
                    transitionDelay: isVisible ? `${cardDelay}ms` : '0ms',
                  }}
                >
                  <div
                    className={`relative z-10 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[radial-gradient(120%_80%_at_50%_0%,#1c1710_0%,#100e0a_60%,#080808_100%)] border border-[#c59a3f]/25 hover:border-[#c59a3f]/50 transition-all flex flex-col items-center justify-center text-center space-y-1 sm:space-y-1.5 shadow-sm h-full ${
                      isOddLast ? 'w-full max-w-[calc(50%-0.375rem)] sm:max-w-none' : 'w-full'
                    }`}
                  >
                    <span className="text-[11px] sm:text-sm font-bold uppercase tracking-wider text-neutral-400">
                      {item.rank}
                    </span>
                    <span className="text-base sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                      {item.amount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Note / Exact internal description paragraph */}
        {note && (
          <div
            className="p-4 mt-6 rounded-xl sm:rounded-2xl bg-black/60 border border-[#c59a3f]/20 flex items-start gap-3 text-xs sm:text-sm text-neutral-300 transition-all duration-700 ease-out"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
              transitionDelay: isVisible ? '1350ms' : '0ms',
            }}
          >
            <Info className="w-4 h-4 text-[#e5ac53] shrink-0 mt-0.5" />
            <p className="leading-relaxed">{note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

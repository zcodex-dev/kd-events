'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { TvScreen, TextOverlayConfig } from '@/types';
import { Move } from 'lucide-react';

type TvDisplayCanvasProps = {
  screen: Partial<TvScreen>;
  isPreview?: boolean;
  isInteractive?: boolean;
  onPositionChange?: (posX: number, posY: number) => void;
};

// Helper to parse media URL for YouTube, Vimeo, direct video, or images
export function parseMediaUrl(url?: string, typeOverride?: string) {
  if (!url || !url.trim()) return { type: 'empty', url: '' };

  const trimmed = url.trim();

  // YouTube detection
  const ytMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube' as const,
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`,
      url: trimmed,
    };
  }

  // Vimeo detection
  const vimeoMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/i
  );
  if (vimeoMatch && vimeoMatch[3]) {
    const videoId = vimeoMatch[3];
    return {
      type: 'vimeo' as const,
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&background=1`,
      url: trimmed,
    };
  }

  // Direct video file
  if (
    typeOverride === 'video' ||
    /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(trimmed)
  ) {
    return { type: 'video' as const, url: trimmed };
  }

  // GIF
  if (
    typeOverride === 'gif' ||
    /\.gif(\?.*)?$/i.test(trimmed)
  ) {
    return { type: 'gif' as const, url: trimmed };
  }

  return { type: 'image' as const, url: trimmed };
}

export function TvDisplayCanvas({
  screen,
  isPreview = false,
  isInteractive = false,
  onPositionChange,
}: TvDisplayCanvasProps) {
  const {
    mediaUrl,
    mediaType = 'auto',
    mediaFit = 'cover',
    bgColor = '#000000',
    overlayOpacity = 0,
    overlayText = {
      enabled: false,
      headline: '',
      subtext: '',
      position: 'bottom',
      posX: 50,
      posY: 80,
      stylePreset: 'gold_jackpot',
      fontSize: 'lg',
      textColor: '#ffffff',
      bgColor: 'rgba(0, 0, 0, 0.75)',
      showGlow: true,
    },
  } = screen;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const mediaInfo = parseMediaUrl(mediaUrl, mediaType);

  // Determine coordinates
  const getCoordinates = useCallback((): { x: number; y: number } => {
    if (typeof overlayText.posX === 'number' && typeof overlayText.posY === 'number') {
      return { x: overlayText.posX, y: overlayText.posY };
    }
    if (overlayText.position === 'top') return { x: 50, y: 15 };
    if (overlayText.position === 'center') return { x: 50, y: 50 };
    if (overlayText.position === 'ticker') return { x: 50, y: 92 };
    return { x: 50, y: 82 }; // bottom default
  }, [overlayText.posX, overlayText.posY, overlayText.position]);

  const { x: posX, y: posY } = getCoordinates();

  // Mouse Drag Handlers for Editor Mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isInteractive || !containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const containerRect = containerRef.current.getBoundingClientRect();
    const currentXpx = (posX / 100) * containerRect.width;
    const currentYpx = (posY / 100) * containerRect.height;

    setDragOffset({
      x: e.clientX - (containerRect.left + currentXpx),
      y: e.clientY - (containerRect.top + currentYpx),
    });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || !onPositionChange) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left - dragOffset.x;
      const mouseY = e.clientY - containerRect.top - dragOffset.y;

      let newX = Math.round((mouseX / containerRect.width) * 100);
      let newY = Math.round((mouseY / containerRect.height) * 100);

      // Clamp between 5% and 95%
      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(5, Math.min(95, newY));

      onPositionChange(newX, newY);
    },
    [isDragging, dragOffset, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Typography sizing classes based on fontSize
  const getTypographyClasses = () => {
    const size = overlayText.fontSize || 'lg';
    switch (size) {
      case 'sm':
        return {
          headline: 'text-xs sm:text-base md:text-xl font-black',
          subtext: 'text-[10px] sm:text-xs md:text-sm font-semibold',
          padding: 'px-4 py-2',
        };
      case 'md':
        return {
          headline: 'text-sm sm:text-xl md:text-2xl font-black',
          subtext: 'text-xs sm:text-sm md:text-base font-semibold',
          padding: 'px-5 py-2.5',
        };
      case 'xl':
        return {
          headline: 'text-xl sm:text-3xl md:text-5xl font-black tracking-tight',
          subtext: 'text-sm sm:text-xl md:text-2xl font-bold',
          padding: 'px-8 py-5',
        };
      case '2xl':
        return {
          headline: 'text-2xl sm:text-4xl md:text-6xl font-black tracking-tight',
          subtext: 'text-base sm:text-2xl md:text-3xl font-extrabold',
          padding: 'px-10 py-6',
        };
      case 'lg':
      default:
        return {
          headline: 'text-base sm:text-2xl md:text-3xl font-black tracking-tight',
          subtext: 'text-xs sm:text-base md:text-lg font-bold',
          padding: 'px-6 py-3.5',
        };
    }
  };

  const typo = getTypographyClasses();
  const preset = overlayText.stylePreset || 'gold_jackpot';

  // Style preset configurations (Clean, crisp typography with no text shadow)
  const getPresetStyles = () => {
    switch (preset) {
      case 'gold_jackpot':
        return {
          boxClasses:
            'bg-gradient-to-b from-neutral-950/95 via-neutral-900/90 to-neutral-950/95 border-2 border-amber-400/80 rounded-2xl shadow-2xl backdrop-blur-md',
          glowClass: overlayText.showGlow ? 'shadow-[0_0_50px_rgba(245,158,11,0.45)]' : '',
          headlineClasses:
            'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent uppercase',
          subtextClasses: 'text-amber-100/95',
        };
      case 'neon_red':
        return {
          boxClasses:
            'bg-neutral-950/90 border-2 border-red-500/90 rounded-2xl shadow-2xl backdrop-blur-md',
          glowClass: overlayText.showGlow ? 'shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse' : '',
          headlineClasses: 'text-red-500 uppercase',
          subtextClasses: 'text-white font-black',
        };
      case 'glass_dark':
        return {
          boxClasses:
            'bg-black/65 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl',
          glowClass: overlayText.showGlow ? 'shadow-[0_0_40px_rgba(255,255,255,0.2)]' : '',
          headlineClasses: 'text-white font-black uppercase',
          subtextClasses: 'text-neutral-200',
        };
      case 'cinema_bar':
        return {
          boxClasses:
            'bg-gradient-to-r from-black/90 via-black/75 to-black/90 border-y border-white/15 rounded-none shadow-2xl backdrop-blur-md w-full',
          glowClass: '',
          headlineClasses: 'text-amber-400 font-extrabold uppercase tracking-widest',
          subtextClasses: 'text-white font-medium',
        };
      case 'minimal':
        return {
          boxClasses: 'bg-transparent border-none shadow-none',
          glowClass: '',
          headlineClasses: 'text-white font-black uppercase',
          subtextClasses: 'text-amber-300 font-bold',
        };
      default:
        return {
          boxClasses: 'bg-black/75 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl',
          glowClass: '',
          headlineClasses: 'text-white uppercase',
          subtextClasses: 'text-neutral-200',
        };
    }
  };

  const styleConfig = getPresetStyles();

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none flex items-center justify-center font-sans ${
        isPreview ? 'rounded-2xl' : ''
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* ── Media Background Layer (YouTube, Vimeo, Video, GIF, or Image) ── */}
      {mediaInfo.type === 'youtube' && (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden flex items-center justify-center">
          <iframe
            key={mediaInfo.embedUrl}
            src={mediaInfo.embedUrl}
            title="YouTube Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            className="w-full h-full border-0 pointer-events-none scale-105"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {mediaInfo.type === 'vimeo' && (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden flex items-center justify-center">
          <iframe
            key={mediaInfo.embedUrl}
            src={mediaInfo.embedUrl}
            title="Vimeo Video Player"
            allow="autoplay; fullscreen; picture-in-picture"
            className="w-full h-full border-0 pointer-events-none scale-105"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      {mediaInfo.type === 'video' && (
        <video
          key={mediaInfo.url}
          src={mediaInfo.url}
          autoPlay
          loop
          muted
          playsInline
          className={`w-full h-full pointer-events-none ${
            mediaFit === 'contain' ? 'object-contain' : 'object-cover'
          }`}
        />
      )}

      {(mediaInfo.type === 'gif' || mediaInfo.type === 'image') && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaInfo.url}
          alt=""
          className={`w-full h-full pointer-events-none ${
            mediaFit === 'contain' ? 'object-contain' : 'object-cover'
          }`}
        />
      )}

      {mediaInfo.type === 'empty' && (
        <div className="flex flex-col items-center justify-center text-neutral-500 gap-3 p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center text-2xl text-neutral-400">
            ▶
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-300">No Media Uploaded or Linked</p>
            <p className="text-xs text-neutral-500 mt-0.5">Upload a video/GIF or paste a YouTube URL from the left panel</p>
          </div>
        </div>
      )}

      {/* Dark Overlay Tint */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-200"
          style={{
            backgroundColor: '#000000',
            opacity: overlayOpacity / 100,
          }}
        />
      )}

      {/* ── Drag & Drop Text Overlay ── */}
      {overlayText?.enabled && (overlayText.headline || overlayText.subtext) && (
        <div
          className={`absolute transition-transform ${
            isInteractive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
          } ${isDragging ? 'scale-105 z-40' : 'z-20'}`}
          style={{
            left: `${posX}%`,
            top: `${posY}%`,
            transform: 'translate(-50%, -50%)',
            maxWidth: preset === 'cinema_bar' ? '100%' : '88%',
            width: preset === 'cinema_bar' ? '100%' : 'auto',
          }}
          onMouseDown={isInteractive ? handleMouseDown : undefined}
        >
          {/* Interactive Selection / Drag Halo Border when hovering in editor */}
          <div
            className={`group relative text-center transition-all ${
              styleConfig.boxClasses
            } ${styleConfig.glowClass} ${typo.padding} ${
              isInteractive
                ? 'hover:ring-2 hover:ring-amber-400/90 hover:ring-offset-2 hover:ring-offset-black/50'
                : ''
            }`}
            style={{
              backgroundColor:
                preset !== 'minimal' && overlayText.bgColor ? overlayText.bgColor : undefined,
            }}
          >
            {/* Position coordinate indicator badge during drag in editor */}
            {isInteractive && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/85 text-amber-400 text-[10px] font-mono font-bold shadow-md border border-amber-400/40 flex items-center gap-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Move className="w-2.5 h-2.5" />
                <span>Drag to move • X:{posX}% Y:{posY}%</span>
              </div>
            )}

            {/* Headline */}
            {overlayText.headline && (
              <h2
                className={`${typo.headline} ${styleConfig.headlineClasses}`}
                style={{ color: overlayText.textColor ? overlayText.textColor : undefined }}
              >
                {overlayText.headline}
              </h2>
            )}

            {/* Subtext / Prize / Numbers */}
            {overlayText.subtext && (
              <p
                className={`${typo.subtext} ${styleConfig.subtextClasses} ${
                  overlayText.headline ? 'mt-1' : ''
                }`}
              >
                {overlayText.subtext}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

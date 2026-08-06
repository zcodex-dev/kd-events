'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TvScreen } from '@/types';
import { TvDisplayCanvas } from '@/components/tv/tv-display-canvas';
import { Maximize, Minimize } from 'lucide-react';

type TvDisplayClientProps = {
  initialScreen: TvScreen;
};

export function TvDisplayClient({ initialScreen }: TvDisplayClientProps) {
  const [screen, setScreen] = useState<TvScreen>(initialScreen);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track initial view count
  useEffect(() => {
    fetch(`/api/tv/${screen.slug}`, { method: 'POST' }).catch(() => {});
  }, [screen.slug]);

  // Real-time live polling for dynamic jackpot & text updates
  useEffect(() => {
    const intervalMs = Math.max(3, screen.refreshIntervalSeconds || 5) * 1000;

    const poll = async () => {
      try {
        const res = await fetch(`/api/tv/${screen.slug}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setScreen((prev) => {
              // Deep compare to prevent unnecessary rerenders
              if (JSON.stringify(prev) !== JSON.stringify(json.data)) {
                return json.data;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Keep current state on network hiccups
      }
    };

    const timer = setInterval(poll, intervalMs);
    return () => clearInterval(timer);
  }, [screen.slug, screen.refreshIntervalSeconds]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  }, []);

  // Keyboard shortcut listener ('F' for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [toggleFullscreen]);

  // Auto-hide mouse cursor & floating controls after 3 seconds of inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [handleMouseMove]);

  return (
    <main 
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-black flex items-center justify-center ${
        !showControls ? 'cursor-none' : 'cursor-default'
      }`}
      onMouseMove={handleMouseMove}
    >
      {/* 16:9 Responsive Display Canvas */}
      <div className="w-full h-full">
        <TvDisplayCanvas screen={screen} isPreview={false} />
      </div>

      {/* Floating Fullscreen / TV Controls (Auto-fades on idle) */}
      <div 
        className={`fixed top-4 right-4 z-50 transition-opacity duration-500 flex items-center gap-2 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white backdrop-blur-md border border-white/20 shadow-xl transition-all cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </main>
  );
}

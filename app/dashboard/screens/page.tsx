'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Tv, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Copy, 
  Check, 
  Video, 
  ImageIcon, 
  Type,
  X,
  Save,
  Loader2,
  Play
} from 'lucide-react';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { LoadingSpinner } from '@/components/shared/loading';
import type { TvScreen } from '@/types';
import { parseMediaUrl } from '@/components/tv/tv-display-canvas';
import Link from 'next/link';

// Interactive Card Thumbnail with Video Hover-Play & YouTube Poster Support
function ScreenCardThumbnail({ screen }: { screen: TvScreen }) {
  const [isHovered, setIsHovered] = useState(false);
  const mediaInfo = parseMediaUrl(screen.mediaUrl, screen.mediaType);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  // Thumbnail poster for YouTube, Vimeo, or Images
  const getThumbnailSrc = () => {
    if (mediaInfo.type === 'youtube' && mediaInfo.videoId) {
      return `https://img.youtube.com/vi/${mediaInfo.videoId}/hqdefault.jpg`;
    }
    if (mediaInfo.type === 'image' || mediaInfo.type === 'gif') {
      return mediaInfo.url;
    }
    return null;
  };

  const thumbSrc = getThumbnailSrc();

  return (
    <div 
      className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden border-b border-neutral-200 dark:border-neutral-800"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── YouTube Video Player / Poster ── */}
      {mediaInfo.type === 'youtube' && (
        <>
          {thumbSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbSrc}
              alt=""
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            />
          )}

          {isHovered && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${mediaInfo.videoId}?autoplay=1&mute=1&loop=1&playlist=${mediaInfo.videoId}&controls=0&modestbranding=1&rel=0`}
              title="YouTube Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full border-0 pointer-events-none scale-105"
            />
          )}

          {/* Play Icon indicator when not hovered */}
          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Vimeo Video Player ── */}
      {mediaInfo.type === 'vimeo' && (
        <>
          {isHovered ? (
            <iframe
              src={`https://player.vimeo.com/video/${mediaInfo.videoId}?autoplay=1&loop=1&muted=1&background=1`}
              title="Vimeo Preview"
              allow="autoplay; fullscreen"
              className="w-full h-full border-0 pointer-events-none scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-400 gap-1">
              <Video className="w-8 h-8 opacity-60 text-sky-400" />
              <span className="text-[10px]">Hover to Play Vimeo</span>
            </div>
          )}
        </>
      )}

      {/* ── Direct Video File (.mp4, .webm) ── */}
      {mediaInfo.type === 'video' && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={mediaInfo.url}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-neutral-900/80 border border-white/20 text-white flex items-center justify-center shadow-lg">
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Animated GIF or Image ── */}
      {(mediaInfo.type === 'gif' || mediaInfo.type === 'image') && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaInfo.url}
          alt=""
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}

      {/* ── Empty Media State ── */}
      {mediaInfo.type === 'empty' && (
        <div className="text-neutral-600 flex flex-col items-center gap-1">
          <Tv className="w-8 h-8 opacity-40" />
          <span className="text-[10px]">No Media</span>
        </div>
      )}

      {/* ── Overlay Text Banner Preview ── */}
      {screen.overlayText?.enabled && (screen.overlayText.headline || screen.overlayText.subtext) && (
        <div className="absolute bottom-2 inset-x-2 z-10 p-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 text-center text-white pointer-events-none">
          {screen.overlayText.headline && (
            <p className="text-[10px] font-bold uppercase truncate">{screen.overlayText.headline}</p>
          )}
          {screen.overlayText.subtext && (
            <p className="text-[9px] text-amber-300 font-semibold truncate">{screen.overlayText.subtext}</p>
          )}
        </div>
      )}

      {/* ── Media Type Badge ── */}
      <div className="absolute top-2.5 left-2.5 z-10 p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-neutral-300 pointer-events-none">
        {mediaInfo.type === 'youtube' || mediaInfo.type === 'vimeo' || mediaInfo.type === 'video' ? (
          <Video className="w-3.5 h-3.5" />
        ) : (
          <ImageIcon className="w-3.5 h-3.5" />
        )}
      </div>

      {/* ── Status Indicator ── */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] text-white pointer-events-none">
        <span className={`w-1.5 h-1.5 rounded-full ${screen.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-500'}`} />
        <span>{screen.enabled ? 'Active' : 'Paused'}</span>
      </div>
    </div>
  );
}

export default function TvScreensPage() {
  const { openSidebar, session } = useDashboard();
  const [screens, setScreens] = useState<TvScreen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Edit Text Overlay Modal State
  const [quickEditScreen, setQuickEditScreen] = useState<TvScreen | null>(null);
  const [quickHeadline, setQuickHeadline] = useState('');
  const [quickSubtext, setQuickSubtext] = useState('');
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);

  const fetchScreens = async () => {
    try {
      const res = await fetch('/api/screens');
      const data = await res.json();
      if (data.success) {
        setScreens(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load TV displays');
      }
    } catch {
      toast.error('Error fetching TV displays');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchScreens();
    }
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this TV display? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/screens/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('TV display deleted successfully');
        fetchScreens();
      } else {
        toast.error(data.error || 'Failed to delete TV display');
      }
    } catch {
      toast.error('Network error during deletion');
    }
  };

  const handleCopyLink = (screen: TvScreen) => {
    const url = screen.shareUrl || `${window.location.origin}/tv/${screen.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(screen.id);
    toast.success('TV Display URL copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openQuickEdit = (screen: TvScreen) => {
    setQuickEditScreen(screen);
    setQuickHeadline(screen.overlayText?.headline || '');
    setQuickSubtext(screen.overlayText?.subtext || '');
  };

  const saveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditScreen) return;

    setIsSavingQuickEdit(true);
    try {
      const updatedOverlay = {
        ...(quickEditScreen.overlayText || { enabled: true, position: 'bottom' as const }),
        enabled: true,
        headline: quickHeadline,
        subtext: quickSubtext,
      };

      const res = await fetch(`/api/screens/${quickEditScreen.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overlayText: updatedOverlay }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Overlay text updated on TV!');
        setQuickEditScreen(null);
        fetchScreens();
      } else {
        toast.error(data.error || 'Failed to update text');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setIsSavingQuickEdit(false);
    }
  };

  const isAdmin = session?.role === 'admin';

  return (
    <>
      <Header
        title="TV Displays / Video Player"
        description="Broadcast promotional videos, animated GIFs & text overlays to TVs"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 max-w-[1850px] w-full mx-auto space-y-6"
      >
        {/* Top Control Bar */}
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Active TV Video Displays</h2>
              <p className="text-xs text-neutral-500">Total displays: {screens.length}</p>
            </div>
          </div>

          {isAdmin && (
            <Link
              href="/dashboard/screens/create"
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors rounded-xl flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Upload New Video / Display
            </Link>
          )}
        </div>

        {/* Displays Grid */}
        {isLoading ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-2 shadow-xs">
            <LoadingSpinner size={24} />
            <span className="text-xs text-neutral-500 font-medium">Loading displays...</span>
          </div>
        ) : screens.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">No TV Displays Yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-5">
              Upload your promotional videos or GIFs and display them full screen on any TV or LCD screen with optional text overlays.
            </p>
            {isAdmin && (
              <Link
                href="/dashboard/screens/create"
                className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload Video / GIF
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {screens.map((screen) => {
              const tvUrl = screen.shareUrl || `/tv/${screen.slug}`;

              return (
                <div 
                  key={screen.id} 
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* 16:9 Thumbnail Preview with Hover Playback */}
                    <ScreenCardThumbnail screen={screen} />

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
                          {screen.title}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                          /{screen.slug}
                        </p>
                      </div>

                      {/* Quick Edit Overlay Text Trigger */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => openQuickEdit(screen)}
                          className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-100/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            <Type className="w-3.5 h-3.5" />
                            <span>Edit Overlay Text / Numbers</span>
                          </div>
                          <span className="text-[11px] font-semibold underline">
                            Quick Edit
                          </span>
                        </button>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                        <span>Polls every {screen.refreshIntervalSeconds || 5}s</span>
                        <span>{new Date(screen.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 pt-0 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/80 mt-2">
                    <div className="flex items-center gap-2 pt-3">
                      <a
                        href={tvUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Launch TV
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(screen)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors cursor-pointer"
                        title="Copy TV URL"
                      >
                        {copiedId === screen.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 pt-3">
                        <Link
                          href={`/dashboard/screens/${screen.id}/edit`}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          title="Full Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(screen.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Display"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Quick Edit Overlay Text Modal */}
      {quickEditScreen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Quick Edit Text Overlay
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-1">
                    {quickEditScreen.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickEditScreen(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveQuickEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Overlay Title / Headline
                </label>
                <input
                  type="text"
                  value={quickHeadline}
                  onChange={(e) => setQuickHeadline(e.target.value)}
                  placeholder="e.g. SPECIAL PROMOTION or JACKPOT"
                  className="w-full px-3 py-2 text-sm font-bold border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Overlay Subtext / Details / Number
                </label>
                <input
                  type="text"
                  value={quickSubtext}
                  onChange={(e) => setQuickSubtext(e.target.value)}
                  placeholder="e.g. WIN USD 500 • TONIGHT AT 8 PM"
                  className="w-full px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-lg focus:outline-none"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Active TVs broadcasting this video will update automatically in ~5 seconds!
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEditScreen(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickEdit}
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {isSavingQuickEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Broadcast to TV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

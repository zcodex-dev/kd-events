'use client';

import { useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { parsePrizePool } from '@/lib/showcase/prize-pool';
import { PrizePoolShowcase } from '@/components/showcase/prize-pool-showcase';

type Props = {
  description?: string | null;
  title: string;
};

function extractImagesFromHtml(html: string): string[] {
  const matches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  return matches.map((m) => m[1]).filter(Boolean);
}

function wrapTables(html: string) {
  return html
    .replace(/<table/gi, '<div class="event-table-wrap not-prose"><table')
    .replace(/<\/table>/gi, '</table></div>');
}

export function EventDetailContent({ description, title }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!description || !description.trim()) {
    return (
      <div className="py-12 text-center text-neutral-500">
        <p className="text-sm">No detailed information provided for this event yet.</p>
      </div>
    );
  }

  const isExplicitImagePost = description.includes('data-post-type="image"');
  const allImages = extractImagesFromHtml(description);
  // Plain text length without HTML tags
  const plainText = description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  const isImagePost = isExplicitImagePost || (allImages.length > 0 && plainText.length < 50);

  // Keyboard navigation & ESC close for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === 'ArrowRight' && allImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : 0));
        resetZoom();
      } else if (e.key === 'ArrowLeft' && allImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : 0));
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    resetZoom();
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
    resetZoom();
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.35, 3.5));
  const zoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ── Render 1: Image Mode Post ──────────────────────────────────────────
  if (isImagePost && allImages.length > 0) {
    return (
      <div className="space-y-6">
        {/* Poster Header hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c3943a]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Event Poster & Rules Sheet</span>
          </div>
          <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <Maximize2 className="w-3 h-3 text-[#c3943a]" />
            Click or tap image to zoom & inspect full details
          </span>
        </div>

        {/* Poster Gallery / Sheets */}
        <div className="space-y-6">
          {allImages.map((imgUrl, idx) => (
            <div
              key={idx}
              onClick={() => handleOpenLightbox(idx)}
              className="group relative w-full rounded-2xl overflow-hidden border border-white/10 hover:border-[#c3943a]/60 bg-neutral-950 transition-all duration-300 shadow-xl cursor-pointer"
            >
              {allImages.length > 1 && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20 shadow-md">
                  Page {idx + 1} of {allImages.length}
                </div>
              )}

              {/* Hover / Tap Zoom Action Badge */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-black/80 hover:bg-[#c3943a] hover:text-black backdrop-blur-md rounded-full text-xs font-bold text-[#e5ac53] border border-[#c3943a]/40 shadow-md transition-all">
                <ZoomIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tap to Zoom</span>
              </div>

              {/* Main Crisp Flyer Image */}
              <img
                src={imgUrl}
                alt={`${title} - Details Page ${idx + 1}`}
                className="w-full h-auto object-contain block mx-auto transition-transform duration-300 group-hover:scale-[1.008]"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />

              {/* Bottom Quick Bar */}
              <div className="px-5 py-3 bg-neutral-900/90 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span className="truncate">{title} — Official Sheet</span>
                <span className="text-[#c3943a] font-medium flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  View Fullscreen
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxIndex !== null && (
          <div
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none"
            onClick={handleCloseLightbox}
          >
            {/* Top Toolbar */}
            <div
              className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/70 border-b border-white/10 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {title}
                </span>
                {allImages.length > 1 && (
                  <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-xs font-semibold text-neutral-300">
                    {lightboxIndex + 1} / {allImages.length}
                  </span>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={zoomOut}
                    disabled={zoomLevel <= 1}
                    className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-bold text-neutral-300 tabular-nums">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={zoomIn}
                    disabled={zoomLevel >= 3.5}
                    className="p-1.5 text-neutral-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  {zoomLevel > 1 && (
                    <button
                      type="button"
                      onClick={resetZoom}
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer ml-1"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <a
                  href={allImages[lightboxIndex]}
                  download={`${title.toLowerCase().replace(/\s+/g, '-')}-flyer.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-[#c3943a] hover:text-black text-neutral-200 rounded-lg transition-colors cursor-pointer"
                  title="Download / Open Original Image"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={handleCloseLightbox}
                  className="p-2 bg-white/10 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer ml-1"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lightbox Image Stage with Pan & Zoom */}
            <div
              className={`flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden ${
                zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={allImages[lightboxIndex]}
                alt={`${title} - Lightbox`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                }}
                className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl select-none"
                draggable={false}
              />

              {/* Prev / Next Buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : 0));
                      resetZoom();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-[#c3943a] hover:text-black text-white rounded-full transition-all border border-white/20 shadow-xl cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : 0));
                      resetZoom();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/70 hover:bg-[#c3943a] hover:text-black text-white rounded-full transition-all border border-white/20 shadow-xl cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Mobile Zoom Tip */}
            <div className="py-2.5 text-center text-xs text-neutral-400 bg-black/60 border-t border-white/5 sm:hidden">
              Pinch or tap image to inspect high-resolution details
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render 2: Rich Text Mode Post ──────────────────────────────────────
  const { prizeData, remainingHtml } = parsePrizePool(description);

  return (
    <>
      {prizeData && <PrizePoolShowcase data={prizeData} />}

      {remainingHtml && (
        <div className="prose prose-invert prose-neutral max-w-none prose-headings:font-bold prose-headings:text-white prose-p:text-neutral-300 prose-p:leading-relaxed prose-a:text-[#c3943a] prose-li:text-neutral-300">
          <div
            dangerouslySetInnerHTML={{
              __html: wrapTables(remainingHtml),
            }}
          />
        </div>
      )}
    </>
  );
}

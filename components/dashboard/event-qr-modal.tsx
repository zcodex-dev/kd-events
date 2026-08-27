'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  X,
  Download,
  Copy,
  Check,
  ExternalLink,
  ClipboardList,
  BookOpen,
  Sparkles,
  Loader2,
  Share2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

type EventQrModalProps = {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
};

const COLOR_PRESETS = [
  { name: 'Classic Black', fg: '#000000', bg: '#ffffff' },
  { name: 'KD Gold', fg: '#c3943a', bg: '#ffffff' },
  { name: 'Luxury Dark', fg: '#e5ac53', bg: '#121212' },
  { name: 'Royal Blue', fg: '#1d4ed8', bg: '#ffffff' },
];

export function EventQrModal({ event, isOpen, onClose }: EventQrModalProps) {
  const [targetType, setTargetType] = useState<'registration' | 'terms'>('registration');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [isSavingDynamic, setIsSavingDynamic] = useState(false);

  const qrRef = useRef<SVGSVGElement>(null);

  // Determine domain base URL
  const origin = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://kompongdewa.win';
  }, []);

  // Compute Destination URL based on selection
  const destinationUrl = useMemo(() => {
    if (!event) return '';
    if (targetType === 'registration') {
      return `${origin}/event/registration?event=${event.id}`;
    }
    return `${origin}/event/${event.id}`;
  }, [origin, event, targetType]);

  const qrTitle = useMemo(() => {
    if (!event) return 'Event QR Code';
    const typeLabel = targetType === 'registration' ? 'Register Form' : 'Details & Terms';
    return `${event.title} - ${typeLabel}`;
  }, [event, targetType]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setHasCopied(false);
    }
  }, [isOpen]);

  const handleCopyLink = () => {
    if (!destinationUrl) return;
    navigator.clipboard.writeText(destinationUrl);
    setHasCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!qrRef.current || !event) return;
    const svg = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const padding = 24;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, padding, padding);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const safeName = (event.title || 'event')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .slice(0, 30);
        downloadLink.download = `qr-${safeName}-${targetType}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
        toast.success('QR Code downloaded (PNG)!');
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleDownloadSvg = () => {
    if (!qrRef.current || !event) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const safeName = (event.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 30);
    downloadLink.download = `qr-${safeName}-${targetType}.svg`;
    downloadLink.href = url;
    downloadLink.click();
    URL.revokeObjectURL(url);
    toast.success('QR Code vector downloaded (SVG)!');
  };

  const handleSaveToDynamicQr = async () => {
    if (!event || !destinationUrl) return;
    setIsSavingDynamic(true);
    try {
      const res = await fetch('/api/admin/qrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: qrTitle,
          type: 'URL',
          destinationUrl,
          fgColor,
          bgColor,
          logoUrl: includeLogo ? '/icon.png' : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Saved to Dynamic QR Tracker (/dashboard/qr)!');
      } else {
        toast.error(data.error || 'Failed to save QR');
      }
    } catch {
      toast.error('Network error saving QR');
    } finally {
      setIsSavingDynamic(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/70 dark:bg-neutral-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#c3943a]/15 text-[#c3943a] rounded-xl border border-[#c3943a]/20">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                Event QR Code Generator
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 max-w-sm sm:max-w-md">
                {event.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* STEP 1: CHOOSE TARGET DESTINATION */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
              1. Choose QR Destination Target
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Register Form */}
              <button
                type="button"
                onClick={() => setTargetType('registration')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none ${
                  targetType === 'registration'
                    ? 'border-[#c3943a] bg-[#c3943a]/10 ring-2 ring-[#c3943a]/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    targetType === 'registration'
                      ? 'bg-[#c3943a] text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      Registration Form
                    </span>
                    {targetType === 'registration' && (
                      <Check className="w-4 h-4 text-[#c3943a] stroke-[3]" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                    Direct form where players enter details to register.
                  </p>
                </div>
              </button>

              {/* Option B: Read Page / Terms */}
              <button
                type="button"
                onClick={() => setTargetType('terms')}
                className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none ${
                  targetType === 'terms'
                    ? 'border-[#c3943a] bg-[#c3943a]/10 ring-2 ring-[#c3943a]/30'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    targetType === 'terms'
                      ? 'bg-[#c3943a] text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      Read Details & Terms
                    </span>
                    {targetType === 'terms' && (
                      <Check className="w-4 h-4 text-[#c3943a] stroke-[3]" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">
                    Full public page with description, schedule, and rules.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 2: PREVIEW & CUSTOMIZE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: QR Display Card */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <div
                className="p-4 rounded-xl shadow-md transition-all flex items-center justify-center border border-neutral-200/80"
                style={{ backgroundColor: bgColor }}
              >
                <QRCodeSVG
                  ref={qrRef}
                  value={destinationUrl}
                  size={190}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="Q"
                  includeMargin={false}
                  imageSettings={
                    includeLogo
                      ? {
                          src: '/icon.png',
                          x: undefined,
                          y: undefined,
                          height: 38,
                          width: 38,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              <div className="mt-3 text-center">
                <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 block truncate max-w-[200px]">
                  {event.title}
                </span>
                <span className="text-[10px] text-[#c3943a] font-semibold tracking-wide uppercase">
                  {targetType === 'registration' ? 'Registration Portal' : 'Event Information'}
                </span>
              </div>
            </div>

            {/* Right: Customization Settings */}
            <div className="md:col-span-7 space-y-4">
              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Color Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((p) => {
                    const isSelected = fgColor === p.fg && bgColor === p.bg;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setFgColor(p.fg);
                          setBgColor(p.bg);
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs'
                            : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: p.fg }}
                        />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo Center Toggle */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#c3943a]" />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                      Kompong Dewa Center Emblem
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      Embed gold resort icon in QR center
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="w-4 h-4 text-[#c3943a] accent-[#c3943a] cursor-pointer rounded"
                />
              </div>

              {/* Target Link Preview */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  Destination Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={destinationUrl}
                    className="flex-1 px-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 font-mono select-all outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    title="Copy Link"
                  >
                    {hasCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-200 transition-colors shrink-0"
                    title="Open destination"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaveToDynamicQr}
            disabled={isSavingDynamic}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-[#c3943a] transition-colors cursor-pointer"
          >
            {isSavingDynamic ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>Save to QR Tracker</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-3.5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SVG Vector</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-4 py-2 text-xs font-bold text-white bg-[#c3943a] hover:bg-[#a87b28] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

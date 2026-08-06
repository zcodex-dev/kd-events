'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Save, 
  Video, 
  Tv, 
  Loader2, 
  ExternalLink,
  Type,
  UploadCloud,
  Sparkles,
  Move,
  Layout,
  Crown,
  Flame,
  Layers,
  Film,
  AlignCenter,
  SlidersHorizontal,
  CaseSensitive
} from 'lucide-react';
import type { TvScreen, TextOverlayConfig } from '@/types';
import { TvDisplayCanvas } from '@/components/tv/tv-display-canvas';
import { directUploadSingleFile } from '@/lib/uploads/client-upload';

type ScreenFormProps = {
  initialData?: TvScreen;
  isEdit?: boolean;
};

const TEXT_STYLES: Array<{
  id: NonNullable<TextOverlayConfig['stylePreset']>;
  name: string;
  desc: string;
  icon: any;
  textColor: string;
  bgColor: string;
  showGlow: boolean;
}> = [
  {
    id: 'gold_jackpot',
    name: 'Gold Jackpot',
    desc: 'Metallic gold border with glowing jackpot badge',
    icon: Crown,
    textColor: '#f59e0b',
    bgColor: 'rgba(10, 10, 10, 0.92)',
    showGlow: true,
  },
  {
    id: 'neon_red',
    name: 'Neon Red Glow',
    desc: 'High energy red glow for urgent promotions',
    icon: Flame,
    textColor: '#ef4444',
    bgColor: 'rgba(5, 5, 5, 0.90)',
    showGlow: true,
  },
  {
    id: 'glass_dark',
    name: 'Frosted Glass',
    desc: 'Clean modern frosted glassmorphism backdrop',
    icon: Layers,
    textColor: '#ffffff',
    bgColor: 'rgba(0, 0, 0, 0.65)',
    showGlow: false,
  },
  {
    id: 'cinema_bar',
    name: 'Cinema Bar',
    desc: 'Full-width cinematic lower-third banner',
    icon: Film,
    textColor: '#fbbf24',
    bgColor: 'rgba(0, 0, 0, 0.85)',
    showGlow: false,
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    desc: 'Pure typography with deep drop shadows',
    icon: AlignCenter,
    textColor: '#ffffff',
    bgColor: 'transparent',
    showGlow: false,
  },
];

export const FONT_FAMILIES = [
  {
    id: 'roboto',
    name: 'Roboto',
    category: 'Clean Modern Sans',
    fontFamily: 'var(--font-roboto), "Roboto", sans-serif',
    sample: 'USD 300 JACKPOT',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'Luxury Serif (VIP & Jackpot)',
    fontFamily: 'var(--font-playfair), "Playfair Display", Georgia, serif',
    sample: 'USD 300 JACKPOT',
  },
  {
    id: 'bebas',
    name: 'Bebas Neue',
    category: 'Bold Condensed Display',
    fontFamily: 'var(--font-bebas), "Bebas Neue", sans-serif',
    sample: 'USD 300 JACKPOT',
  },
  {
    id: 'outfit',
    name: 'Outfit',
    category: 'Contemporary Tech',
    fontFamily: 'var(--font-outfit), "Outfit", sans-serif',
    sample: 'USD 300 JACKPOT',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    category: 'Bold Impact',
    fontFamily: 'var(--font-montserrat), "Montserrat", sans-serif',
    sample: 'USD 300 JACKPOT',
  },
] as const;

export function ScreenForm({ initialData, isEdit }: ScreenFormProps) {
  const router = useRouter();

  // ─── Basic State ───
  const [title, setTitle] = useState(initialData?.title || '');
  const [enabled, setEnabled] = useState(initialData?.enabled ?? true);

  // ─── Media State ───
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [mediaType, setMediaType] = useState<'video' | 'gif' | 'image' | 'youtube' | 'vimeo' | 'auto'>(
    initialData?.mediaType || 'auto'
  );
  const [mediaFit, setMediaFit] = useState<'cover' | 'contain'>(initialData?.mediaFit || 'cover');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#000000');
  const [overlayOpacity, setOverlayOpacity] = useState(initialData?.overlayOpacity ?? 0);

  // ─── Overlay Text State ───
  const [textEnabled, setTextEnabled] = useState(initialData?.overlayText?.enabled ?? true);
  const [headline, setHeadline] = useState(initialData?.overlayText?.headline || 'POKER HIGH HAND JACKPOT');
  const [subtext, setSubtext] = useState(initialData?.overlayText?.subtext || 'USD 300 • WINNING STARTS AT 8:00 PM');
  const [position, setPosition] = useState<NonNullable<TextOverlayConfig['position']>>(
    initialData?.overlayText?.position || 'bottom'
  );
  const [posX, setPosX] = useState<number>(initialData?.overlayText?.posX ?? 50);
  const [posY, setPosY] = useState<number>(initialData?.overlayText?.posY ?? 80);
  const [stylePreset, setStylePreset] = useState<NonNullable<TextOverlayConfig['stylePreset']>>(
    initialData?.overlayText?.stylePreset || 'gold_jackpot'
  );
  const [fontSize, setFontSize] = useState<NonNullable<TextOverlayConfig['fontSize']>>(
    initialData?.overlayText?.fontSize || 'lg'
  );
  const [fontScale, setFontScale] = useState<number>(
    initialData?.overlayText?.fontScale ?? 
    (initialData?.overlayText?.fontSize === 'sm' ? 24 : initialData?.overlayText?.fontSize === 'md' ? 36 : initialData?.overlayText?.fontSize === 'xl' ? 64 : initialData?.overlayText?.fontSize === '2xl' ? 88 : 48)
  );
  const [fontFamily, setFontFamily] = useState<string>(
    initialData?.overlayText?.fontFamily || 'roboto'
  );
  const [textColor, setTextColor] = useState(initialData?.overlayText?.textColor || '#ffffff');
  const [overlayBgColor, setOverlayBgColor] = useState(initialData?.overlayText?.bgColor || 'rgba(0, 0, 0, 0.75)');
  const [showGlow, setShowGlow] = useState(initialData?.overlayText?.showGlow ?? true);

  // Active Tab on the left panel: 'media' | 'text' | 'styles'
  const [activeTab, setActiveTab] = useState<'media' | 'text' | 'styles'>('media');

  // TV Sync Settings
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(initialData?.refreshIntervalSeconds || 5);

  // Uploading & Submitting
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply style preset
  const handleApplyPreset = (preset: typeof TEXT_STYLES[number]) => {
    setStylePreset(preset.id);
    setTextColor(preset.textColor);
    setOverlayBgColor(preset.bgColor);
    setShowGlow(preset.showGlow);
    setTextEnabled(true);
    toast.success(`Applied ${preset.name} style`);
  };

  // Quick Align Positions
  const handleQuickAlign = (x: number, y: number, posName: NonNullable<TextOverlayConfig['position']>) => {
    setPosX(x);
    setPosY(y);
    setPosition(posName);
  };

  // Direct Drag Handler from Canvas
  const handleCanvasPositionChange = (newX: number, newY: number) => {
    setPosX(newX);
    setPosY(newY);
    setPosition('custom');
  };

  // Handle direct media file upload (Video, GIF, or Image)
  const handleMediaUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = await directUploadSingleFile(file);
      if (data && data.imageUrl) {
        setMediaUrl(data.imageUrl);
        if (file.type.startsWith('video/')) {
          setMediaType('video');
        } else if (file.type === 'image/gif') {
          setMediaType('gif');
        } else {
          setMediaType('image');
        }
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
        toast.success('Media uploaded successfully!');
      } else {
        toast.error('Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a display title');
      return;
    }
    if (!mediaUrl.trim()) {
      toast.error('Please upload a video, GIF, or image');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEdit ? `/api/screens/${initialData?.id}` : '/api/screens';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        title,
        enabled,
        mediaUrl,
        mediaType,
        mediaFit,
        bgColor,
        overlayOpacity: Number(overlayOpacity),
        overlayText: {
          enabled: textEnabled,
          headline,
          subtext,
          position,
          posX,
          posY,
          stylePreset,
          fontSize,
          fontScale: Number(fontScale) || 48,
          fontFamily,
          textColor,
          bgColor: overlayBgColor,
          showGlow,
        },
        refreshIntervalSeconds: Number(refreshIntervalSeconds) || 5,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'TV display updated!' : 'TV display created!');
        router.push('/dashboard/screens');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to save display');
      }
    } catch {
      toast.error('Network error while saving display');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Current Live Preview Object
  const currentPreviewData: Partial<TvScreen> = {
    title,
    enabled,
    mediaUrl,
    mediaType,
    mediaFit,
    bgColor,
    overlayOpacity,
    overlayText: {
      enabled: textEnabled,
      headline,
      subtext,
      position,
      posX,
      posY,
      stylePreset,
      fontSize,
      fontScale,
      fontFamily,
      textColor,
      bgColor: overlayBgColor,
      showGlow,
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Top Header Bar: Display Name & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Tv className="w-5 h-5" />
          </div>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Display Name (e.g. Lobby VIP Jackpot Video)"
              className="w-full px-3 py-1.5 text-sm font-bold border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl">
            <span>Auto-Sync:</span>
            <select
              value={refreshIntervalSeconds}
              onChange={(e) => setRefreshIntervalSeconds(Number(e.target.value))}
              className="font-bold bg-transparent border-none text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value={3}>3s</option>
              <option value={5}>5s</option>
              <option value={10}>10s</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Save Changes' : 'Publish to TV'}
          </button>
        </div>
      </div>

      {/* Main Studio: Left Toolbar + Big Center Canvas Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Side: Clean Accordion / Tabbed Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Navigation Tabs for Sidebar */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Media</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Text & Info</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('styles')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'styles'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Styles</span>
            </button>
          </div>

          {/* TAB 1: MEDIA UPLOAD & DISPLAY SETTINGS */}
          {activeTab === 'media' && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <Video className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Video, GIF, or Image
                </h3>
              </div>

              {/* Drag & Drop File Picker */}
              <div className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-2xl p-5 text-center transition-colors bg-neutral-50/50 dark:bg-neutral-950/50">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,image/gif,image/png,image/jpeg,image/webp"
                  id="media-file-input-tab"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleMediaUpload(e.target.files[0])}
                />
                <label
                  htmlFor="media-file-input-tab"
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-blue-500">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <UploadCloud className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {isUploading ? 'Uploading file...' : 'Upload Video or GIF'}
                    </span>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      MP4, WebM, GIF, PNG up to 100MB
                    </p>
                  </div>
                </label>
              </div>

              {/* URL fallback */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-neutral-500">
                  Or Paste YouTube, Video, or GIF URL
                </label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMediaUrl(val);
                    const trimmed = val.trim();
                    if (/youtube\.com|youtu\.be/i.test(trimmed)) {
                      setMediaType('youtube');
                    } else if (/vimeo\.com/i.test(trimmed)) {
                      setMediaType('vimeo');
                    } else if (/\.(mp4|webm|mov)(\?.*)?$/i.test(trimmed)) {
                      setMediaType('video');
                    } else if (/\.gif(\?.*)?$/i.test(trimmed)) {
                      setMediaType('gif');
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or video/GIF URL"
                  className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-lg focus:outline-none"
                />
              </div>

              {/* Fit Mode */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[11px] font-semibold text-neutral-500">
                  Scaling / Fit
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaFit('cover')}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      mediaFit === 'cover'
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Full Screen 16:9
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaFit('contain')}
                    className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      mediaFit === 'contain'
                        ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Original Ratio
                  </button>
                </div>
              </div>

              {/* Dark Tint Slider */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-neutral-500">
                  <span>Dark Contrast Tint</span>
                  <span>{overlayOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: TEXT & OVERLAY CONTENT */}
          {activeTab === 'text' && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Text & Captions Overlay
                  </h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={textEnabled}
                    onChange={(e) => setTextEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {textEnabled && (
                <div className="space-y-4">
                  {/* Headline */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                      Headline / Title
                    </label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. POKER HIGH HAND JACKPOT"
                      className="w-full px-3 py-2 text-xs font-bold border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Subtext */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                      Subtext / Amount / Schedule
                    </label>
                    <input
                      type="text"
                      value={subtext}
                      onChange={(e) => setSubtext(e.target.value)}
                      placeholder="e.g. USD 300 • WINNING STARTS AT 8:00 PM"
                      className="w-full px-3 py-2 text-xs border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  {/* Font Family Chooser */}
                  <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                        <CaseSensitive className="w-3.5 h-3.5 text-amber-500" />
                        Font Family
                      </label>
                      <span className="text-[10px] text-neutral-500 capitalize">{fontFamily}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FONT_FAMILIES.map((font) => {
                        const isSelected = fontFamily === font.id;
                        return (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => setFontFamily(font.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-1 ring-amber-500/50 shadow-xs'
                                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                {font.name}
                              </span>
                              {isSelected && (
                                <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-md">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div
                              className="text-xs font-bold truncate text-neutral-700 dark:text-neutral-300"
                              style={{ fontFamily: font.fontFamily }}
                            >
                              {font.sample}
                            </div>
                            <span className="text-[9px] text-neutral-400 dark:text-neutral-500">
                              {font.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font Size Drag Slider & Unlimited Scale */}
                  <div className="space-y-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                        Font Size & Scale
                      </label>
                      <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
                        <input
                          type="number"
                          min="10"
                          max="400"
                          value={fontScale}
                          onChange={(e) => setFontScale(Math.max(10, Number(e.target.value) || 10))}
                          className="w-12 text-center text-xs font-bold font-mono bg-transparent border-0 focus:outline-none text-amber-600 dark:text-amber-400"
                        />
                        <span className="text-[10px] text-neutral-500 font-semibold">px</span>
                      </div>
                    </div>

                    {/* Drag Slider */}
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="16"
                        max="360"
                        step="1"
                        value={fontScale}
                        onChange={(e) => setFontScale(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-400 font-mono px-0.5">
                        <span>16px (Subtle)</span>
                        <span>80px (Standard)</span>
                        <span>180px (Jackpot)</span>
                        <span>360px+ (Mega TV)</span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-6 gap-1 pt-1">
                      {[
                        { label: 'S', px: 40 },
                        { label: 'M', px: 70 },
                        { label: 'L', px: 110 },
                        { label: 'XL', px: 160 },
                        { label: '2XL', px: 220 },
                        { label: 'Cinema', px: 300 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFontScale(preset.px)}
                          className={`py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            fontScale === preset.px
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position Quick Snap Buttons */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                      <span>Quick Snap Position</span>
                      <span className="font-mono text-amber-500">X:{posX}% Y:{posY}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickAlign(50, 15, 'top')}
                        className="py-1.5 px-2 text-[11px] font-bold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                      >
                        Top Center
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAlign(50, 50, 'center')}
                        className="py-1.5 px-2 text-[11px] font-bold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAlign(50, 82, 'bottom')}
                        className="py-1.5 px-2 text-[11px] font-bold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                      >
                        Bottom Center
                      </button>
                    </div>
                  </div>

                  {/* Direct Drag Hint */}
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Move className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>You can click and drag the text on the preview canvas to place it anywhere!</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEXT STYLES & PRESETS */}
          {activeTab === 'styles' && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                  Choose Text Style Preset
                </h3>
              </div>

              <div className="space-y-2.5">
                {TEXT_STYLES.map((style) => {
                  const Icon = style.icon;
                  const isSelected = stylePreset === style.id;

                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => handleApplyPreset(style)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                            {style.name}
                          </h4>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          {style.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Fine-Tuning Colors */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-neutral-500">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-7 h-7 rounded border border-neutral-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border border-neutral-200 dark:border-neutral-800 rounded font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="glow-box"
                    checked={showGlow}
                    onChange={(e) => setShowGlow(e.target.checked)}
                    className="rounded text-amber-500 cursor-pointer"
                  />
                  <label htmlFor="glow-box" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Glow Pulse
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: BIG 16:9 Interactive Drag & Drop Canvas (8 cols) */}
        <div className="lg:col-span-8 sticky top-4 space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                16:9 Cinema TV Canvas (Interactive Drag & Drop Studio)
              </span>
            </div>

            {isEdit && initialData?.shareUrl && (
              <a
                href={initialData.shareUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                Launch TV Display
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Large Aspect Ratio Canvas Frame */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-neutral-800 bg-black">
            <TvDisplayCanvas
              screen={currentPreviewData}
              isPreview={true}
              isInteractive={true}
              onPositionChange={handleCanvasPositionChange}
            />
          </div>

          {/* Interactive Drag Banner Notification */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 text-white border border-neutral-800 text-xs shadow-md">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Drag to position:</strong> Click and drag the text box on the video canvas above to move it anywhere.
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
              <span>X: <strong className="text-white">{posX}%</strong></span>
              <span>Y: <strong className="text-white">{posY}%</strong></span>
            </div>
          </div>

        </div>

      </div>

    </form>
  );
}

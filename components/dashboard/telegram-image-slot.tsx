'use client';

import { useState } from 'react';
import { Send, Upload, X, Link2, Images } from 'lucide-react';
import { MediaLibraryModal } from '@/components/dashboard/media-library-modal';
import { isHttpUrl, type ImageSlot, emptySlot, slotIsFilled } from '@/components/dashboard/event-image-slots';
import { isVideoFile } from '@/lib/uploads/file-utils';
import { toast } from 'sonner';

type Props = {
  slot: ImageSlot;
  onChange: (slot: ImageSlot) => void;
  hasVideoCover?: boolean;
};

export function TelegramImageSlot({ slot, onChange, hasVideoCover }: Props) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const preview = slot.file ? objectUrl : slot.url.trim() && isHttpUrl(slot.url) ? slot.url.trim() : slot.existing;
  const filled = slotIsFilled(slot);

  const setFile = (file: File | null) => {
    if (file && (isVideoFile(file.name) || file.type.startsWith('video/'))) {
      toast.error('Telegram alert requires a static image (JPG/PNG/WEBP), not a video.');
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (file) {
      setObjectUrl(URL.createObjectURL(file));
      onChange({ file, url: '', existing: null });
    } else {
      setObjectUrl(null);
      onChange({ file: null, url: '', existing: slot.existing });
    }
  };

  const clear = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    onChange(emptySlot());
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) {
      setFile(file);
    } else {
      toast.error('Please drop an image file (JPG, PNG, WEBP).');
    }
  };

  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors ${
        hasVideoCover
          ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20'
          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-950/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Send className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            Telegram Alert Thumbnail (Image Only)
          </span>
          {hasVideoCover && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded">
              Recommended for Video Events
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#c3943a] bg-[#c3943a]/10 hover:bg-[#c3943a]/20 rounded-md transition-colors cursor-pointer"
          >
            <Images className="w-3.5 h-3.5" />
            <span>Choose from Library</span>
          </button>
          {filled && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {/* Drop zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`relative shrink-0 w-32 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors overflow-hidden ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-950'
          }`}
        >
          {preview ? (
            <img src={preview} alt="Telegram thumbnail" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <>
              <Upload className="w-4 h-4 text-neutral-400 mb-1" />
              <span className="text-[10px] leading-tight text-neutral-500 px-2">
                Drop thumbnail image
                <br />
                or click to browse
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {/* URL field */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
              Telegram Image URL
            </label>
          </div>
          <div className="relative">
            <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={slot.file ? '' : slot.url}
              disabled={Boolean(slot.file)}
              onChange={(e) => {
                const val = e.target.value;
                if (isVideoFile(val)) {
                  toast.error('Telegram alert requires an image, not a video.');
                  return;
                }
                onChange({ file: null, url: val, existing: null });
              }}
              placeholder="https://... or /api/raw?key=..."
              spellCheck={false}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-[10px] text-neutral-400 truncate">
            {slot.file
              ? `Uploading: ${slot.file.name}`
              : 'Paste an image link or select one from library. Sent to Telegram when users register.'}
          </p>
        </div>
      </div>

      <p className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
        Telegram registration alerts require a static image to show a visual photo card instead of a text link. 
        When your event uses an MP4 video banner on the website, this image is used as the Telegram alert thumbnail.
      </p>
    </div>
  );
}

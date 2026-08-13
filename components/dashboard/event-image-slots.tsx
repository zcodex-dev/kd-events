'use client';

import { useState } from 'react';
import { Image as ImageIcon, Upload, X, Link2 } from 'lucide-react';

export const MAX_EVENT_IMAGES = 3;

export type ImageSlot = {
  /** A newly picked file, not yet uploaded. */
  file: File | null;
  /** A pasted link. */
  url: string;
  /** An already-saved image being edited; cleared when the slot is emptied. */
  existing: string | null;
};

export const emptySlot = (): ImageSlot => ({ file: null, url: '', existing: null });

export const emptySlots = (): ImageSlot[] =>
  Array.from({ length: MAX_EVENT_IMAGES }, emptySlot);

/** Fills the slots from an event's saved images, padding out to MAX. */
export const slotsFromImages = (images: string[]): ImageSlot[] =>
  Array.from({ length: MAX_EVENT_IMAGES }, (_, i) =>
    images[i] ? { file: null, url: images[i], existing: images[i] } : emptySlot()
  );

export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

/** What a slot should show as its preview, if anything. */
function slotPreview(slot: ImageSlot, objectUrl: string | null): string | null {
  if (slot.file) return objectUrl;
  const url = slot.url.trim();
  if (isHttpUrl(url)) return url;
  return slot.existing;
}

export const slotIsFilled = (slot: ImageSlot) =>
  Boolean(slot.file || slot.url.trim() || slot.existing);

type Props = {
  slots: ImageSlot[];
  onChange: (slots: ImageSlot[]) => void;
};

export function EventImageSlots({ slots, onChange }: Props) {
  const [dragSlot, setDragSlot] = useState<number | null>(null);
  // Object URLs for locally-picked files, keyed by slot index.
  const [objectUrls, setObjectUrls] = useState<Record<number, string>>({});

  const update = (index: number, patch: Partial<ImageSlot>) => {
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const setFile = (index: number, file: File | null) => {
    setObjectUrls((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      const next = { ...prev };
      if (file) next[index] = URL.createObjectURL(file);
      else delete next[index];
      return next;
    });
    // A file replaces whatever the slot held.
    update(index, { file, url: '', existing: file ? null : slots[index].existing });
  };

  const clear = (index: number) => {
    setObjectUrls((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      const next = { ...prev };
      delete next[index];
      return next;
    });
    onChange(slots.map((slot, i) => (i === index ? emptySlot() : slot)));
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    setDragSlot(null);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) setFile(index, file);
  };

  return (
    <div className="space-y-3">
      {slots.map((slot, index) => {
        const preview = slotPreview(slot, objectUrls[index] ?? null);
        const filled = slotIsFilled(slot);
        const isDragging = dragSlot === index;

        return (
          <div
            key={index}
            className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 bg-neutral-50/60 dark:bg-neutral-950/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Image {index + 1}
                {index === 0 && <span className="ml-1.5 font-normal text-neutral-400">(cover)</span>}
              </span>
              {filled && (
                <button
                  type="button"
                  onClick={() => clear(index)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {/* Drop zone */}
              <label
                onDragOver={(e) => { e.preventDefault(); setDragSlot(index); }}
                onDragLeave={() => setDragSlot(null)}
                onDrop={(e) => handleDrop(index, e)}
                className={`relative shrink-0 w-32 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-colors overflow-hidden ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-950'
                }`}
              >
                {preview ? (
                  <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-neutral-400 mb-1" />
                    <span className="text-[10px] leading-tight text-neutral-500 px-2">
                      Drop image here
                      <br />
                      or click to browse
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setFile(index, e.target.files?.[0] ?? null)}
                />
              </label>

              {/* URL field */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                  Image URL {index + 1}
                </label>
                <div className="relative">
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  <input
                    type="url"
                    value={slot.file ? '' : slot.url}
                    disabled={Boolean(slot.file)}
                    onChange={(e) => update(index, { url: e.target.value, existing: null })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="mt-1 text-[10px] text-neutral-400 truncate">
                  {slot.file
                    ? `Uploading: ${slot.file.name}`
                    : 'Paste a direct link, or drop a file on the left.'}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-neutral-500 dark:text-neutral-500 flex items-start gap-1.5">
        <ImageIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Each image becomes its own slide in the registration carousel. Use{' '}
          <strong className="font-semibold text-neutral-700 dark:text-neutral-300">
            1200 × 1500 (4:5 portrait)
          </strong>{' '}
          — that fills the phone carousel edge to edge with nothing cropped. Other
          shapes still work, but the top and bottom get trimmed to fit.
        </span>
      </p>
    </div>
  );
}

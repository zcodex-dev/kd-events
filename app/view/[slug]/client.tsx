'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Download,
  Copy,
  Maximize2,
  ImageIcon,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import type { UploadedFile } from '@/types';
import { formatDate, resolveUrl } from '@/lib/uploads/file-utils';

type ViewPageClientProps = {
  file: UploadedFile;
};

export function ViewPageClient({ file }: ViewPageClientProps) {
  const [copied, setCopied] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const imageUrl = resolveUrl(file.imageUrl);

  // Increment view count on mount
  useEffect(() => {
    fetch(`/api/views/${file.slug}`, { method: 'POST' }).catch(() => {
      // Non-critical
    });
  }, [file.slug]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(file.shareUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#171717',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
          },
        }}
      />

      <div className="min-h-screen bg-neutral-50">
        {/* Navigation / Header */}
        <header className="bg-black border-b border-neutral-900 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center">
              <div className="logo-container-sweep py-1">
                <Image
                  src="/logo.png"
                  alt="Kompong Dewa Logo"
                  width={220}
                  height={48}
                  className="h-12 w-auto shrink-0 object-contain"
                  unoptimized
                />
                <div className="logo-sweep-overlay" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>{formatDate(file.uploadedAt)}</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-5xl mx-auto py-6 sm:py-10 space-y-6"
        >
          {/* Seamless Vertical Image Stack (Zero Gap) */}
          <div className="w-full flex flex-col gap-0 bg-transparent">
            {/* Primary Main Image */}
            <div className="w-full flex justify-center bg-transparent">
              <Image
                src={imageUrl}
                alt={file.originalName}
                width={file.width || 1200}
                height={file.height || 900}
                className="w-full h-auto object-contain cursor-pointer"
                onClick={() => setFullscreenUrl(imageUrl)}
                unoptimized
                priority
              />
            </div>

            {/* Additional Images Stack */}
            {file.additionalImages && file.additionalImages.length > 0 && (
              <>
                {file.additionalImages.map((img) => {
                  const resolvedAdditionalUrl = resolveUrl(img.imageUrl);
                  return (
                    <div
                      key={img.id}
                      className="w-full flex justify-center bg-transparent"
                    >
                      <Image
                        src={resolvedAdditionalUrl}
                        alt={img.originalName}
                        width={img.width || 1200}
                        height={img.height || 900}
                        className="w-full h-auto object-contain cursor-pointer"
                        onClick={() => setFullscreenUrl(resolvedAdditionalUrl)}
                        unoptimized
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* File info & actions */}
          <div className="px-4 sm:px-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pt-2">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 break-all">
                {file.originalName}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                Shared Page Link
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 rounded-lg transition-colors font-medium cursor-pointer"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={() => setFullscreenUrl(imageUrl)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 rounded-lg transition-colors font-medium cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
              <button
                onClick={() => downloadFile(imageUrl, file.originalName)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors font-medium cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Main
              </button>
            </div>
          </div>
        </motion.main>
      </div>

      {/* Fullscreen overlay */}
      {fullscreenUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            onClick={() => setFullscreenUrl(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fullscreenUrl}
            alt="Fullscreen view"
            className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg"
          />
        </motion.div>
      )}
    </>
  );
}

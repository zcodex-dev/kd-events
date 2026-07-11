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
  FileType2,
  Ruler,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import type { UploadedFile } from '@/types';
import { formatFileSize, formatDate, resolveUrl } from '@/lib/uploads/file-utils';

type ViewPageClientProps = {
  file: UploadedFile;
};

export function ViewPageClient({ file }: ViewPageClientProps) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = file.originalName;
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
            border: '1px solid #e5e5e5',
            color: '#171717',
            fontSize: '14px',
          },
        }}
      />

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="border-b border-neutral-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-blue-600" strokeWidth={2} />
              <span className="font-semibold text-neutral-900 text-sm tracking-tight">
                FileUpload
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
        >
          {/* Image */}
          <div className="bg-white border border-neutral-200 p-2 sm:p-4 mb-6">
            <div className="relative flex items-center justify-center bg-neutral-50 min-h-[200px]">
              <Image
                src={imageUrl}
                alt={file.originalName}
                width={file.width || 800}
                height={file.height || 600}
                className="max-w-full max-h-[70vh] w-auto h-auto object-contain cursor-pointer"
                onClick={() => setIsFullscreen(true)}
                unoptimized
                priority
              />
            </div>
          </div>

          {/* File info & actions */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 break-all">
                {file.originalName}
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {formatDate(file.uploadedAt)}
              </p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-neutral-200 text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
              <button
                onClick={downloadFile}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-neutral-900 hover:bg-neutral-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* File details */}
          <div className="mt-6 bg-white border border-neutral-200">
            <div className="px-4 py-3 border-b border-neutral-200">
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                File Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
              <InfoItem
                icon={FileType2}
                label="Format"
                value={file.mimeType.split('/')[1]?.toUpperCase() || 'Unknown'}
              />
              <InfoItem
                icon={Ruler}
                label="Size"
                value={formatFileSize(file.size)}
              />
              {file.width && file.height && (
                <InfoItem
                  icon={Maximize2}
                  label="Dimensions"
                  value={`${file.width} × ${file.height} px`}
                />
              )}
            </div>
          </div>
        </motion.main>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>
          <Image
            src={imageUrl}
            alt={file.originalName}
            width={file.width || 1920}
            height={file.height || 1080}
            className="max-w-[95vw] max-h-[95vh] object-contain"
            unoptimized
          />
        </motion.div>
      )}
    </>
  );
}

// ─── Info Item ──────────────────────────────────────────────────────────────

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="w-4 h-4 text-neutral-400" strokeWidth={1.75} />
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm text-neutral-900 font-medium">{value}</p>
      </div>
    </div>
  );
}

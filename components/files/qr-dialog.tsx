'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { UploadedFile } from '@/types';

type QrDialogProps = {
  file: UploadedFile | null;
  onClose: () => void;
};

export function QrDialog({ file, onClose }: QrDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file) {
      generateQr(file.shareUrl);
    } else {
      setQrCode(null);
    }
  }, [file]);

  const generateQr = async (url: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.data.qrCode);
      } else {
        toast.error('Failed to generate QR code');
      }
    } catch {
      toast.error('Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadQr = () => {
    if (!qrCode || !file) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-${file.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyShareLink = async () => {
    if (!file) return;
    try {
      await navigator.clipboard.writeText(file.shareUrl);
      setCopied(true);
      toast.success('Share link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <AnimatePresence>
      {file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white border border-neutral-200 w-full max-w-sm p-6 rounded-xl shadow-xl z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              QR Code
            </h3>

            <p className="text-xs text-neutral-500 mb-4 truncate">
              {file.originalName}
            </p>

            {/* QR Code */}
            <div className="flex items-center justify-center mb-5">
              {isLoading ? (
                <div className="w-48 h-48 bg-neutral-100 animate-pulse rounded-lg" />
              ) : qrCode ? (
                <Image
                  src={qrCode}
                  alt="QR Code"
                  width={192}
                  height={192}
                  className="w-48 h-48 rounded-lg"
                  unoptimized
                />
              ) : (
                <div className="w-48 h-48 bg-neutral-100 flex items-center justify-center text-sm text-neutral-400 rounded-lg">
                  Failed to load
                </div>
              )}
            </div>

            {/* Share URL */}
            <div className="mb-4 p-2 bg-neutral-50 border border-neutral-200 rounded-lg">
              <p className="text-xs text-neutral-500 truncate">{file.shareUrl}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={copyShareLink}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copied' : 'Copy Link'}
              </button>
              <button
                onClick={downloadQr}
                disabled={!qrCode}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

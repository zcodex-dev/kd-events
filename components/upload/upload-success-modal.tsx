'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, ExternalLink, Download, Plus, Check, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import type { UploadResult } from '@/types';

type UploadSuccessModalProps = {
  result: UploadResult | null;
  onClose: () => void;
  onUploadMore: () => void;
};

export function UploadSuccessModal({ result, onClose, onUploadMore }: UploadSuccessModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (result) {
      fetchQr(result.shareUrl);
    }
  }, [result]);

  const fetchQr = async (url: string) => {
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        setQrCode(data.data.qrCode);
      }
    } catch {
      // Non-critical failure
    }
  };

  const copyText = async (text: string, field: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${label} copied`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const downloadQr = () => {
    if (!qrCode || !result) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qr-${result.file.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white border border-neutral-200 w-full max-w-lg max-h-[90vh] overflow-y-auto z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                Upload successful
              </h3>
              <p className="text-xs text-neutral-500 mb-5">
                Your file has been uploaded and is ready to share.
              </p>

              {/* Thumbnail */}
              <div className="mb-5 bg-neutral-50 border border-neutral-200 p-2 flex items-center justify-center">
                <Image
                  src={result.imageUrl}
                  alt={result.file.originalName}
                  width={320}
                  height={200}
                  className="max-h-48 w-auto object-contain"
                  unoptimized
                />
              </div>

              {/* File info */}
              <p className="text-sm text-neutral-900 font-medium mb-4">
                {result.file.originalName}
              </p>

              {/* Image URL */}
              <UrlField
                label="Direct Image URL"
                url={result.imageUrl}
                copied={copiedField === 'imageUrl'}
                onCopy={() => copyText(result.imageUrl, 'imageUrl', 'Image URL')}
              />

              {/* Share URL */}
              <UrlField
                label="Public Share URL"
                url={result.shareUrl}
                copied={copiedField === 'shareUrl'}
                onCopy={() => copyText(result.shareUrl, 'shareUrl', 'Share URL')}
              />

              {/* QR Code */}
              {qrCode && (
                <div className="mb-5">
                  <label className="block text-xs font-medium text-neutral-500 mb-2">
                    QR Code
                  </label>
                  <div className="flex items-center gap-4">
                    <Image
                      src={qrCode}
                      alt="QR Code"
                      width={96}
                      height={96}
                      className="w-24 h-24"
                      unoptimized
                    />
                    <button
                      onClick={downloadQr}
                      className="flex items-center gap-2 px-3 py-2 text-xs border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download QR
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                <button
                  onClick={() => window.open(result.shareUrl, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Page
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onUploadMore();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Upload Another
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── URL Field Component ────────────────────────────────────────────────────

function UrlField({
  label,
  url,
  copied,
  onCopy,
}: {
  label: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-neutral-500 mb-1.5">
        {label}
      </label>
      <div className="flex items-center border border-neutral-200">
        <input
          type="text"
          value={url}
          readOnly
          className="flex-1 px-3 py-2 text-xs text-neutral-700 bg-neutral-50 border-none focus:outline-none min-w-0"
        />
        <button
          onClick={onCopy}
          className="px-3 py-2 text-neutral-500 hover:text-neutral-700 border-l border-neutral-200 transition-colors"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

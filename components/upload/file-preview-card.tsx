'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { FileUploadItem } from '@/types';
import { formatFileSize } from '@/lib/uploads/file-utils';

type FilePreviewCardProps = {
  item: FileUploadItem;
  onRemove: () => void;
  isUploading: boolean;
};

export function FilePreviewCard({ item, onRemove, isUploading }: FilePreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-3 p-3 bg-white border border-neutral-200"
    >
      {/* Thumbnail */}
      <div className="w-12 h-12 bg-neutral-100 overflow-hidden shrink-0">
        <Image
          src={item.preview}
          alt={item.name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 truncate">{item.name}</p>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
          <span>{formatFileSize(item.size)}</span>
          {item.width && item.height && (
            <>
              <span>·</span>
              <span>{item.width}×{item.height}</span>
            </>
          )}
        </div>

        {/* Progress bar */}
        {item.status === 'uploading' && (
          <div className="mt-1.5 h-1 bg-neutral-100 overflow-hidden">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${item.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Error */}
        {item.status === 'error' && item.error && (
          <p className="text-xs text-red-600 mt-1">{item.error}</p>
        )}
      </div>

      {/* Status / Remove */}
      <div className="shrink-0">
        {item.status === 'success' ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" strokeWidth={1.75} />
        ) : item.status === 'error' ? (
          <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={1.75} />
        ) : (
          <button
            onClick={onRemove}
            disabled={isUploading}
            className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
            aria-label={`Remove ${item.name}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

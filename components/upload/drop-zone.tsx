'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FileUploadItem } from '@/types';
import { MAX_FILE_SIZE } from '@/lib/validation/schemas';
import { formatFileSize } from '@/lib/uploads/file-utils';
import { nanoid } from 'nanoid';
import { FilePreviewCard } from '@/components/upload/file-preview-card';

type DropZoneProps = {
  files: FileUploadItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileUploadItem[]>>;
  onUpload: () => void;
  isUploading: boolean;
};

export function DropZone({ files, setFiles, onUpload, isUploading }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [allowedMimeTypes, setAllowedMimeTypes] = useState<string[]>([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.allowedTypes) {
          setAllowedMimeTypes(data.data.allowedTypes);
        }
      })
      .catch(() => {});
  }, []);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newItems: FileUploadItem[] = [];
      const errors: string[] = [];

      Array.from(fileList).forEach((file) => {
        // Validate type
        if (!allowedMimeTypes.includes(file.type)) {
          errors.push(`${file.name}: unsupported format`);
          return;
        }
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`);
          return;
        }

        const preview = URL.createObjectURL(file);
        const item: FileUploadItem = {
          id: nanoid(8),
          file,
          preview,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          progress: 0,
        };

        // Read dimensions
        const img = new window.Image();
        img.onload = () => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, width: img.naturalWidth, height: img.naturalHeight }
                : f
            )
          );
        };
        img.src = preview;

        newItems.push(item);
      });

      if (errors.length > 0) {
        errors.forEach((e) => toast.error(e));
      }

      if (newItems.length > 0) {
        setFiles((prev) => [...prev, ...newItems]);
      }
    },
    [setFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const item = prev.find((f) => f.id === id);
        if (item) URL.revokeObjectURL(item.preview);
        return prev.filter((f) => f.id !== id);
      });
    },
    [setFiles]
  );

  const clearAll = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  }, [files, setFiles]);

  return (
    <div>
      {/* Drop area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 sm:p-12 cursor-pointer transition-colors duration-200
          flex flex-col items-center justify-center text-center
          ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="Upload area. Click or drag files here."
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <Upload
          className={`w-8 h-8 mb-3 ${isDragOver ? 'text-blue-500' : 'text-neutral-400'}`}
          strokeWidth={1.5}
        />
        <p className="text-sm font-medium text-neutral-700 mb-1">
          {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-neutral-500">
          JPG, PNG, WebP — up to {formatFileSize(MAX_FILE_SIZE)}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleInputChange}
          className="hidden"
          aria-label="File input"
        />
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-neutral-700">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearAll}
              className="text-xs text-neutral-500 hover:text-neutral-700"
              disabled={isUploading}
            >
              Clear all
            </button>
          </div>

          <div className="space-y-2">
            {files.map((item) => (
              <FilePreviewCard
                key={item.id}
                item={item}
                onRemove={() => removeFile(item.id)}
                isUploading={isUploading}
              />
            ))}
          </div>

          {/* Error summary */}
          {files.some((f) => f.status === 'error') && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">
                Some files failed to upload. You can retry or remove them.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onUpload}
              disabled={isUploading || files.every((f) => f.status === 'success')}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={clearAll}
              disabled={isUploading}
              className="px-5 py-2.5 text-sm text-neutral-700 border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

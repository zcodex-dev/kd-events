'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { UploadedFile } from '@/types';
import { formatFileSize } from '@/lib/uploads/file-utils';
import { MAX_FILE_SIZE } from '@/lib/validation/schemas';
import { LoadingSpinner } from '@/components/shared/loading';

type ReplaceDialogProps = {
  file: UploadedFile | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function ReplaceDialog({ file, onClose, onSuccess }: ReplaceDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [allowedMimeTypes, setAllowedMimeTypes] = useState<string[]>([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch allowed MIME types configuration
  useEffect(() => {
    if (!file) return;

    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.allowedTypes) {
          setAllowedMimeTypes(data.data.allowedTypes);
        }
      })
      .catch(() => {});
  }, [file]);

  const handleFileSelect = (newFile: File) => {
    // Validate MIME Type
    if (!allowedMimeTypes.includes(newFile.type)) {
      const allowedNames = allowedMimeTypes
        .map((t) => t.split('/')[1]?.toUpperCase() || t)
        .join(', ');
      toast.error(`Unsupported format. Allowed formats: ${allowedNames}`);
      return;
    }

    // Validate File Size
    if (newFile.size > MAX_FILE_SIZE) {
      toast.error(`File is too large. Limit is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setSelectedFile(newFile);

    // Create preview
    const objectUrl = URL.createObjectURL(newFile);
    setPreview(objectUrl);

    // Get dimensions
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
    };
    img.src = objectUrl;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setDimensions(null);
    setUploadProgress(0);
    onClose();
  };

  const handleSubmit = async () => {
    if (!file || !selectedFile) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (dimensions) {
      formData.append('width', dimensions.width.toString());
      formData.append('height', dimensions.height.toString());
    }

    try {
      // Use XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const errData = JSON.parse(xhr.responseText);
              reject(new Error(errData.error || 'Failed to replace image'));
            } catch {
              reject(new Error('Failed to replace image'));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during replacement'));
        });

        xhr.open('POST', `/api/files/${file.id}/replace`);
        xhr.send(formData);
      });

      await uploadPromise;
      toast.success('Image replaced successfully');
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to replace image');
    } finally {
      setIsSubmitting(false);
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
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white border border-neutral-200 w-full max-w-lg p-6 z-10"
          >
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-neutral-900 mb-2">
              Replace Image / Artwork
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Select a new image. The public URL and QR code will remain exactly the same.
            </p>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">Important Note:</span> The QR code image and URL will **NOT** change. Anyone scanning your existing printed layouts will automatically see the new image.
              </div>
            </div>

            {/* Upload Area */}
            {!preview ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/20'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept={allowedMimeTypes.join(',')}
                />
                <Upload className="w-6 h-6 text-neutral-400 mb-3" />
                <span className="text-sm font-medium text-neutral-800">
                  Select new image
                </span>
                <span className="text-xs text-neutral-500 mt-1">
                  Drag & drop, or click to browse
                </span>
              </div>
            ) : (
              <div className="border border-neutral-200 p-3 mb-5">
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 bg-neutral-50 border border-neutral-100 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Replacement preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {selectedFile && formatFileSize(selectedFile.size)}
                      {dimensions && ` · ${dimensions.width} × ${dimensions.height} px`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      setDimensions(null);
                    }}
                    disabled={isSubmitting}
                    className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Submission Actions */}
            {isSubmitting && (
              <div className="mb-4">
                <div className="flex justify-between items-center text-xs text-neutral-500 mb-1">
                  <span>Uploading replacement...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-neutral-100 h-1.5 overflow-hidden">
                  <div
                    className="bg-neutral-900 h-full transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-neutral-700 border border-neutral-200 hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedFile}
                className="px-4 py-2 text-sm text-white bg-neutral-900 hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size={14} />
                    Replacing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace Image
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

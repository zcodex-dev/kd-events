'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Header } from '@/components/shared/header';
import { DropZone } from '@/components/upload/drop-zone';
import { UploadSuccessModal } from '@/components/upload/upload-success-modal';
import { useDashboard } from '@/app/dashboard/layout';
import { ShieldAlert } from 'lucide-react';
import type { FileUploadItem, UploadResult } from '@/types';

export default function UploadPage() {
  const { openSidebar, session } = useDashboard();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [successResult, setSuccessResult] = useState<UploadResult | null>(null);

  // Album specific states
  const [groupAsAlbum, setGroupAsAlbum] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');

  if (session && !session.permissions.canUpload) {
    return (
      <>
        <Header title="Upload Files" onMenuClick={openSidebar} />
        <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm text-center font-sans">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            You do not have permission to upload new files. Please contact an administrator.
          </p>
        </div>
      </>
    );
  }

  const handleUploadAlbum = useCallback(async (pendingFiles: FileUploadItem[]) => {
    setIsUploading(true);

    // Mark all files as uploading
    setFiles((prev) =>
      prev.map((f) =>
        pendingFiles.some((pf) => pf.id === f.id)
          ? { ...f, status: 'uploading' as const, progress: 10 }
          : f
      )
    );

    try {
      const formData = new FormData();
      if (albumTitle.trim()) {
        formData.append('title', albumTitle.trim());
      }

      pendingFiles.forEach((item, index) => {
        formData.append('files', item.file);
        if (item.width) formData.append(`width_${index}`, item.width.toString());
        if (item.height) formData.append(`height_${index}`, item.height.toString());
      });

      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            pendingFiles.some((pf) => pf.id === f.id) && f.progress < 95
              ? { ...f, progress: f.progress + 5 }
              : f
          )
        );
      }, 300);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await res.json();

      if (data.success) {
        setFiles((prev) =>
          prev.map((f) =>
            pendingFiles.some((pf) => pf.id === f.id)
              ? { ...f, status: 'success' as const, progress: 100, result: data.data }
              : f
          )
        );
        setSuccessResult(data.data);
        setAlbumTitle('');
        setGroupAsAlbum(false);
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            pendingFiles.some((pf) => pf.id === f.id)
              ? { ...f, status: 'error' as const, progress: 0, error: data.error }
              : f
          )
        );
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      setFiles((prev) =>
        prev.map((f) =>
          pendingFiles.some((pf) => pf.id === f.id)
            ? { ...f, status: 'error' as const, progress: 0, error: 'Network error' }
            : f
        )
      );
      toast.error('Network error during upload');
    } finally {
      setIsUploading(false);
    }
  }, [albumTitle]);

  const handleUploadIndividual = useCallback(async (pendingFiles: FileUploadItem[]) => {
    setIsUploading(true);

    for (const item of pendingFiles) {
      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'uploading' as const, progress: 10 } : f
        )
      );

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        if (item.width) formData.append('width', item.width.toString());
        if (item.height) formData.append('height', item.height.toString());

        // Simulate progress steps
        const progressInterval = setInterval(() => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id && f.progress < 80
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 300);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        const data = await res.json();

        if (data.success) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: 'success' as const, progress: 100, result: data.data }
                : f
            )
          );

          // Show success modal for the last uploaded file (or single upload)
          if (item === pendingFiles[pendingFiles.length - 1]) {
            setSuccessResult(data.data);
          }
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: 'error' as const, progress: 0, error: data.error }
                : f
            )
          );
          toast.error(data.error || 'Upload failed');
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error' as const, progress: 0, error: 'Network error' }
              : f
          )
        );
        toast.error('Network error during upload');
      }
    }

    setIsUploading(false);
  }, []);

  const handleUpload = useCallback(async () => {
    const pendingFiles = files.filter(
      (f) => f.status === 'pending' || f.status === 'error'
    );

    if (pendingFiles.length === 0) {
      toast.error('No files to upload');
      return;
    }

    if (groupAsAlbum) {
      await handleUploadAlbum(pendingFiles);
    } else {
      await handleUploadIndividual(pendingFiles);
    }
  }, [files, groupAsAlbum, handleUploadAlbum, handleUploadIndividual]);

  const handleUploadMore = () => {
    // Clear successful files, keep errored ones
    setFiles((prev) => prev.filter((f) => f.status === 'error'));
    setSuccessResult(null);
  };

  return (
    <>
      <Header
        title="Upload Files"
        description="Upload images to generate shareable links"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6"
      >
        <DropZone
          files={files}
          setFiles={setFiles}
          onUpload={handleUpload}
          isUploading={isUploading}
          groupAsAlbum={groupAsAlbum}
          setGroupAsAlbum={setGroupAsAlbum}
          albumTitle={albumTitle}
          setAlbumTitle={setAlbumTitle}
        />
      </motion.div>

      <UploadSuccessModal
        result={successResult}
        onClose={() => setSuccessResult(null)}
        onUploadMore={handleUploadMore}
      />
    </>
  );
}

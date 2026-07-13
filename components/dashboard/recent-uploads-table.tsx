'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreHorizontal,
  ExternalLink,
  Copy,
  Link2,
  QrCode,
  Download,
  Pencil,
  Trash2,
  ImageIcon,
  Check,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UploadedFile } from '@/types';
import { formatFileSize, formatDate, resolveUrl } from '@/lib/uploads/file-utils';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RenameDialog } from '@/components/files/rename-dialog';
import { QrDialog } from '@/components/files/qr-dialog';
import { ReplaceDialog } from '@/components/files/replace-dialog';
import { useDashboard } from '@/app/dashboard/layout';

type RecentUploadsTableProps = {
  files: UploadedFile[];
  isLoading: boolean;
  onRefresh: () => void;
  limit?: number;
};

export function RecentUploadsTable({
  files,
  isLoading,
  onRefresh,
  limit,
}: RecentUploadsTableProps) {
  const { session } = useDashboard();
  const canDelete = session?.permissions.canDelete ?? true;
  const canReplace = session?.permissions.canReplace ?? true;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteFile, setDeleteFile] = useState<UploadedFile | null>(null);
  const [renameFile, setRenameFile] = useState<UploadedFile | null>(null);
  const [qrFile, setQrFile] = useState<UploadedFile | null>(null);
  const [replaceFile, setReplaceFile] = useState<UploadedFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const displayFiles = limit ? files.slice(0, limit) : files;

  const copyToClipboard = useCallback(async (text: string, id: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(`${label} copied`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const handleDelete = async () => {
    if (!deleteFile) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/files/${deleteFile.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('File deleted');
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(false);
      setDeleteFile(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <div className="h-5 w-32 bg-neutral-100 animate-pulse" />
        </div>
        <div className="space-y-0 divide-y divide-neutral-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="w-10 h-10 bg-neutral-100 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-neutral-100 w-2/5" />
                <div className="h-3 bg-neutral-50 w-1/4" />
              </div>
              <div className="h-3 bg-neutral-100 w-14 hidden sm:block" />
              <div className="h-3 bg-neutral-100 w-16 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white border border-neutral-200">
        <EmptyState
          icon={ImageIcon}
          title="No files uploaded"
          description="Upload your first image to get started."
        />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
          {/* Table header - desktop */}
          <div className="hidden md:grid grid-cols-[auto_1fr_80px_80px_100px_80px_60px] gap-4 items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          <div className="w-10" />
          <div>Name</div>
          <div>Type</div>
          <div>Size</div>
          <div>Uploaded</div>
          <div>Views</div>
          <div />
        </div>

        {/* Table rows */}
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          <AnimatePresence>
            {displayFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="relative group"
              >
                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-[auto_1fr_80px_80px_100px_80px_60px] gap-4 items-center px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 rounded-md border border-neutral-100 dark:border-neutral-700">
                    <Image
                      src={resolveUrl(file.imageUrl)}
                      alt={file.originalName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Name */}
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 truncate">{file.originalName}</p>
                  </div>

                  {/* Type */}
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {file.mimeType.split('/')[1]?.toUpperCase()}
                  </div>

                  {/* Size */}
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{formatFileSize(file.size)}</div>

                  {/* Date */}
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(file.uploadedAt)}</div>

                  {/* Views */}
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">{file.viewCount}</div>

                  {/* Actions menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === file.id ? null : file.id)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {openMenuId === file.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 py-1 rounded-lg shadow-lg"
                          >
                            <ActionMenuItem
                              icon={ExternalLink}
                              label="View"
                              onClick={() => {
                                window.open(resolveUrl(file.shareUrl), '_blank');
                                setOpenMenuId(null);
                              }}
                            />
                            <ActionMenuItem
                              icon={copiedId === `img-${file.id}` ? Check : Copy}
                              label="Copy Image URL"
                              onClick={() => {
                                copyToClipboard(resolveUrl(file.imageUrl), `img-${file.id}`, 'Image URL');
                                setOpenMenuId(null);
                              }}
                            />
                            <ActionMenuItem
                              icon={copiedId === `share-${file.id}` ? Check : Link2}
                              label="Copy Share Link"
                              onClick={() => {
                                copyToClipboard(resolveUrl(file.shareUrl), `share-${file.id}`, 'Share link');
                                setOpenMenuId(null);
                              }}
                            />
                            <ActionMenuItem
                              icon={QrCode}
                              label="Show QR Code"
                              onClick={() => {
                                setQrFile(file);
                                setOpenMenuId(null);
                              }}
                            />
                            <ActionMenuItem
                              icon={Download}
                              label="Download"
                              onClick={() => {
                                downloadImage(file);
                                setOpenMenuId(null);
                              }}
                            />
                            {canReplace && (
                              <ActionMenuItem
                                icon={Pencil}
                                label="Rename"
                                onClick={() => {
                                  setRenameFile(file);
                                  setOpenMenuId(null);
                                }}
                              />
                            )}
                            {canReplace && (
                              <ActionMenuItem
                                icon={RefreshCw}
                                label="Manage Images"
                                onClick={() => {
                                  setReplaceFile(file);
                                  setOpenMenuId(null);
                                }}
                              />
                            )}
                            {canDelete && (
                              <>
                                <div className="border-t border-neutral-100 my-1" />
                                <ActionMenuItem
                                  icon={Trash2}
                                  label="Delete"
                                  destructive
                                  onClick={() => {
                                    setDeleteFile(file);
                                    setOpenMenuId(null);
                                  }}
                                />
                              </>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="md:hidden flex items-center gap-3 p-4">
                  <div className="w-12 h-12 bg-neutral-100 overflow-hidden shrink-0 rounded-lg border border-neutral-100">
                    <Image
                      src={resolveUrl(file.imageUrl)}
                      alt={file.originalName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 truncate">{file.originalName}</p>
                    <p className="text-xs text-neutral-500">
                      {formatFileSize(file.size)} · {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === file.id ? null : file.id)}
                      className="p-2 text-neutral-400"
                      aria-label="Actions"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {openMenuId === file.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-10 z-20 w-48 bg-white border border-neutral-200 py-1 rounded-lg shadow-lg"
                          >
                            <ActionMenuItem icon={ExternalLink} label="View" onClick={() => { window.open(resolveUrl(file.shareUrl), '_blank'); setOpenMenuId(null); }} />
                            <ActionMenuItem icon={Copy} label="Copy Image URL" onClick={() => { copyToClipboard(resolveUrl(file.imageUrl), `img-${file.id}`, 'Image URL'); setOpenMenuId(null); }} />
                            <ActionMenuItem icon={Link2} label="Copy Share Link" onClick={() => { copyToClipboard(resolveUrl(file.shareUrl), `share-${file.id}`, 'Share link'); setOpenMenuId(null); }} />
                            <ActionMenuItem icon={QrCode} label="QR Code" onClick={() => { setQrFile(file); setOpenMenuId(null); }} />
                            <ActionMenuItem icon={Download} label="Download" onClick={() => { downloadImage(file); setOpenMenuId(null); }} />
                            {canReplace && <ActionMenuItem icon={Pencil} label="Rename" onClick={() => { setRenameFile(file); setOpenMenuId(null); }} />}
                            {canReplace && <ActionMenuItem icon={RefreshCw} label="Manage Images" onClick={() => { setReplaceFile(file); setOpenMenuId(null); }} />}
                            {canDelete && (
                              <>
                                <div className="border-t border-neutral-100 my-1" />
                                <ActionMenuItem icon={Trash2} label="Delete" destructive onClick={() => { setDeleteFile(file); setOpenMenuId(null); }} />
                              </>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={!!deleteFile}
        onClose={() => setDeleteFile(null)}
        onConfirm={handleDelete}
        title="Delete file"
        message={`Are you sure you want to delete "${deleteFile?.originalName}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />

      <RenameDialog
        file={renameFile}
        onClose={() => setRenameFile(null)}
        onSuccess={onRefresh}
      />

      <QrDialog
        file={qrFile}
        onClose={() => setQrFile(null)}
      />

      <ReplaceDialog
        file={replaceFile}
        onClose={() => setReplaceFile(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}

// ─── Action Menu Item ───────────────────────────────────────────────────────

function ActionMenuItem({
  icon: Icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
        ${destructive
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }
      `}
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}

// ─── Download helper ────────────────────────────────────────────────────────

function downloadImage(file: UploadedFile) {
  const link = document.createElement('a');
  link.href = resolveUrl(file.imageUrl);
  link.download = file.originalName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

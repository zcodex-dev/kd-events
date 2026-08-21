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
  Video,
  Check,
  RefreshCw,
  FolderInput,
} from 'lucide-react';
import { toast } from 'sonner';
import type { UploadedFile } from '@/types';
import { formatFileSize, formatDate, resolveUrl, isVideoFile } from '@/lib/uploads/file-utils';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RenameDialog } from '@/components/files/rename-dialog';
import { QrDialog } from '@/components/files/qr-dialog';
import { ReplaceDialog } from '@/components/files/replace-dialog';
import { MoveDialog } from '@/components/files/move-dialog';
import { useDashboard } from '@/app/dashboard/layout';

type RecentUploadsTableProps = {
  files: UploadedFile[];
  isLoading: boolean;
  onRefresh: () => void;
  limit?: number;
  viewMode?: 'list' | 'grid';
};

export function RecentUploadsTable({
  files,
  isLoading,
  onRefresh,
  limit,
  viewMode = 'list',
}: RecentUploadsTableProps) {
  const { session } = useDashboard();
  const canDelete = session?.permissions.canDelete ?? true;
  const canReplace = session?.permissions.canReplace ?? true;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteFile, setDeleteFile] = useState<UploadedFile | null>(null);
  const [renameFile, setRenameFile] = useState<UploadedFile | null>(null);
  const [qrFile, setQrFile] = useState<UploadedFile | null>(null);
  const [replaceFile, setReplaceFile] = useState<UploadedFile | null>(null);
  const [moveFiles, setMoveFiles] = useState<UploadedFile[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const displayFiles = limit ? files.slice(0, limit) : files;
  const existingFolders = Array.from(new Set(files.map(f => f.folder).filter(Boolean))) as string[];

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === displayFiles.length && displayFiles.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayFiles.map(f => f.id)));
    }
  }, [displayFiles, selectedIds.size]);

  const toggleSelect = useCallback((id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  }, [selectedIds]);

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
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="h-5 w-32 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded" />
        </div>
        <div className="space-y-0 divide-y divide-neutral-100 dark:divide-neutral-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 shrink-0 rounded-md" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 bg-neutral-100 dark:bg-neutral-800 w-2/5 rounded" />
                <div className="h-3 bg-neutral-50 dark:bg-neutral-800/50 w-1/4 rounded" />
              </div>
              <div className="h-3 bg-neutral-100 dark:bg-neutral-800 w-14 hidden sm:block rounded" />
              <div className="h-3 bg-neutral-100 dark:bg-neutral-800 w-16 hidden md:block rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl">
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
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedIds.size} file{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const filesToMove = displayFiles.filter(f => selectedIds.has(f.id));
                setMoveFiles(filesToMove);
              }}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FolderInput className="w-4 h-4" />
              Move Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
          {/* Table header - desktop */}
          <div className="hidden md:grid grid-cols-[auto_auto_1fr_100px_80px_80px_100px_80px_60px] gap-4 items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            <div className="w-5 flex items-center justify-center">
              <input 
                type="checkbox" 
                className="rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                checked={displayFiles.length > 0 && selectedIds.size === displayFiles.length}
                onChange={toggleSelectAll}
              />
            </div>
            <div className="w-10" />
            <div>Name</div>
            <div>Folder</div>
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
                  <div className={`hidden md:grid grid-cols-[auto_auto_1fr_100px_80px_80px_100px_80px_60px] gap-4 items-center px-4 py-3 transition-colors ${selectedIds.has(file.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
                    {/* Checkbox */}
                    <div className="w-5 flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        checked={selectedIds.has(file.id)}
                        onChange={() => toggleSelect(file.id)}
                      />
                    </div>
                    {/* Thumbnail */}
                    <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 rounded-md border border-neutral-100 dark:border-neutral-700 relative">
                      {isVideoFile(file.mimeType || file.originalName) ? (
                        <video
                          src={resolveUrl(file.imageUrl)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          autoPlay
                          loop
                        />
                      ) : (
                        <Image
                          src={resolveUrl(file.imageUrl)}
                          alt={file.originalName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      )}
                    </div>

                    {/* Name */}
                    <div className="min-w-0">
                      <p className="text-sm text-neutral-900 dark:text-neutral-100 truncate">{file.originalName}</p>
                    </div>

                    {/* Folder */}
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {file.folder ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                          {file.folder}
                        </span>
                      ) : (
                        '—'
                      )}
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
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl py-1 z-50"
                            >
                              <ActionMenuItem
                                icon={ExternalLink}
                                label="Open link"
                                onClick={() => {
                                  window.open(resolveUrl(file.imageUrl), '_blank');
                                  setOpenMenuId(null);
                                }}
                              />
                              <ActionMenuItem
                                icon={Copy}
                                label="Copy link"
                                onClick={() => {
                                  copyToClipboard(resolveUrl(file.imageUrl), file.id, 'Link');
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
                              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                              <ActionMenuItem
                                icon={Link2}
                                label="Share Shortlink"
                                onClick={() => {
                                  copyToClipboard(
                                    `${window.location.origin}/view/${file.slug}`,
                                    file.id,
                                    'Shortlink'
                                  );
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
                              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                              <ActionMenuItem
                                icon={FolderInput}
                                label="Move to Folder"
                                onClick={() => {
                                  setMoveFiles([file]);
                                  setOpenMenuId(null);
                                }}
                              />
                              {canReplace && (
                                <>
                                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                                  <ActionMenuItem
                                    icon={Pencil}
                                    label="Rename"
                                    onClick={() => {
                                      setRenameFile(file);
                                      setOpenMenuId(null);
                                    }}
                                  />
                                  <ActionMenuItem
                                    icon={RefreshCw}
                                    label="Replace File"
                                    onClick={() => {
                                      setReplaceFile(file);
                                      setOpenMenuId(null);
                                    }}
                                  />
                                </>
                              )}
                              {canDelete && (
                                <>
                                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
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

                  {/* Mobile row */}
                  <div className={`md:hidden flex items-center gap-4 px-4 py-3 transition-colors ${selectedIds.has(file.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}>
                    <input 
                      type="checkbox" 
                      className="rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedIds.has(file.id)}
                      onChange={() => toggleSelect(file.id)}
                    />
                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 shrink-0 rounded-md overflow-hidden relative border border-neutral-100 dark:border-neutral-700">
                      {isVideoFile(file.mimeType || file.originalName) ? (
                        <video
                          src={resolveUrl(file.imageUrl)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          autoPlay
                          loop
                        />
                      ) : (
                        <Image
                          src={resolveUrl(file.imageUrl)}
                          alt={file.originalName}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {file.originalName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {file.folder && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                            {file.folder}
                          </span>
                        )}
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="relative pt-1">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === file.id ? null : file.id)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {openMenuId === file.id && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute right-0 mt-1 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl py-1 z-50"
                            >
                              <ActionMenuItem
                                icon={ExternalLink}
                                label="Open link"
                                onClick={() => {
                                  window.open(resolveUrl(file.imageUrl), '_blank');
                                  setOpenMenuId(null);
                                }}
                              />
                              <ActionMenuItem
                                icon={Copy}
                                label="Copy link"
                                onClick={() => {
                                  copyToClipboard(resolveUrl(file.imageUrl), file.id, 'Link');
                                  setOpenMenuId(null);
                                }}
                              />
                              <ActionMenuItem
                                icon={Link2}
                                label="Share Shortlink"
                                onClick={() => {
                                  copyToClipboard(
                                    `${window.location.origin}/view/${file.slug}`,
                                    file.id,
                                    'Shortlink'
                                  );
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
                              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                              <ActionMenuItem
                                icon={FolderInput}
                                label="Move to Folder"
                                onClick={() => {
                                  setMoveFiles([file]);
                                  setOpenMenuId(null);
                                }}
                              />
                              {canReplace && (
                                <>
                                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                                  <ActionMenuItem
                                    icon={Pencil}
                                    label="Rename"
                                    onClick={() => {
                                      setRenameFile(file);
                                      setOpenMenuId(null);
                                    }}
                                  />
                                  <ActionMenuItem
                                    icon={RefreshCw}
                                    label="Replace File"
                                    onClick={() => {
                                      setReplaceFile(file);
                                      setOpenMenuId(null);
                                    }}
                                  />
                                </>
                              )}
                              {canDelete && (
                                <>
                                  <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <div className="columns-3 sm:columns-4 md:columns-5 lg:columns-6 xl:columns-8 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
          <AnimatePresence>
            {displayFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative break-inside-avoid flex flex-col bg-transparent ${selectedIds.has(file.id) ? 'ring-2 ring-blue-500 rounded-xl shadow-md' : 'transition-all'}`}
              >
                <div className={`absolute top-2 left-2 z-20 transition-opacity ${selectedIds.has(file.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <input
                    type="checkbox"
                    className="rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500 w-5 h-5 shadow-sm bg-white dark:bg-neutral-900 cursor-pointer"
                    checked={selectedIds.has(file.id)}
                    onChange={() => toggleSelect(file.id)}
                  />
                </div>
                <div className="relative w-full rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs flex items-center justify-center">
                  {/* Media */}
                {isVideoFile(file.mimeType || file.originalName) ? (
                  <video
                    src={resolveUrl(file.imageUrl)}
                    className="w-full h-auto object-contain"
                    muted
                    playsInline
                    autoPlay
                    loop
                  />
                ) : (
                  <img
                    src={resolveUrl(file.imageUrl)}
                    alt={file.originalName}
                    className="w-full h-auto object-contain"
                  />
                )}
                </div>

                {/* Actions overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 dark:bg-neutral-900/90 rounded-md backdrop-blur-sm border border-black/5 dark:border-white/10 shadow-sm">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setOpenMenuId(openMenuId === file.id ? null : file.id);
                    }}
                    className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {openMenuId === file.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl py-1 z-50"
                        >
                          <ActionMenuItem
                            icon={ExternalLink}
                            label="Open link"
                            onClick={() => {
                              window.open(resolveUrl(file.imageUrl), '_blank');
                              setOpenMenuId(null);
                            }}
                          />
                          <ActionMenuItem
                            icon={Copy}
                            label="Copy link"
                            onClick={() => {
                              copyToClipboard(resolveUrl(file.imageUrl), file.id, 'Link');
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
                          <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                          <ActionMenuItem
                            icon={Link2}
                            label="Share Shortlink"
                            onClick={() => {
                              copyToClipboard(
                                `${window.location.origin}/view/${file.slug}`,
                                file.id,
                                'Shortlink'
                              );
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
                          <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
                          <ActionMenuItem
                            icon={FolderInput}
                            label="Move to Folder"
                            onClick={() => {
                              setMoveFile(file);
                              setOpenMenuId(null);
                            }}
                          />
                          {canReplace && (
                            <>
                              <ActionMenuItem
                                icon={Pencil}
                                label="Rename"
                                onClick={() => {
                                  setRenameFile(file);
                                  setOpenMenuId(null);
                                }}
                              />
                              <ActionMenuItem
                                icon={RefreshCw}
                                label="Replace File"
                                onClick={() => {
                                  setReplaceFile(file);
                                  setOpenMenuId(null);
                                }}
                              />
                            </>
                          )}
                          {canDelete && (
                            <>
                              <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />
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

                {/* Info block (bottom) */}
                <div className="mt-2 px-1">
                  <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {file.originalName}
                  </p>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-[10px] text-neutral-500">{formatFileSize(file.size)}</p>
                    {file.folder && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded text-neutral-600 dark:text-neutral-400">
                        {file.folder}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

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

      {/* Move Dialog */}
      {moveFiles && (
        <MoveDialog
          files={moveFiles}
          existingFolders={existingFolders}
          onClose={() => setMoveFiles(null)}
          onSuccess={() => {
            setSelectedIds(new Set());
            onRefresh();
          }}
        />
      )}
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

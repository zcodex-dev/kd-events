'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Images,
  Search,
  Check,
  X,
  Loader2,
  UploadCloud,
  Folder,
  FileImage,
  Film,
  Calendar,
  HardDrive,
} from 'lucide-react';
import type { UploadedFile, ApiResponse } from '@/types';
import { toast } from 'sonner';
import { directUploadSingleFile } from '@/lib/uploads/client-upload';

type MediaLibraryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, file: UploadedFile) => void;
  title?: string;
  fileType?: 'image' | 'video' | 'all';
};

function formatBytes(bytes: number, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Choose from Media Library',
  fileType = 'image',
}: MediaLibraryModalProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch files when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const typeParam = fileType === 'all' ? '' : fileType === 'image' ? 'image' : 'video';
    const url = `/api/files${typeParam ? `?type=${typeParam}` : ''}`;

    fetch(url)
      .then((res) => res.json())
      .then((data: ApiResponse<UploadedFile[]>) => {
        if (data.success && Array.isArray(data.data)) {
          setFiles(data.data);
        } else {
          setFiles([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch media library:', err);
        toast.error('Failed to load media library');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, fileType]);

  // Extract unique folders
  const folders = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (f.folder && f.folder.trim()) set.add(f.folder.trim());
    });
    return Array.from(set);
  }, [files]);

  // Filter files by search & folder
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch =
        !search.trim() ||
        f.originalName.toLowerCase().includes(search.toLowerCase().trim()) ||
        f.storedName.toLowerCase().includes(search.toLowerCase().trim());

      const matchesFolder =
        selectedFolder === 'all' ||
        (selectedFolder === 'root' && (!f.folder || !f.folder.trim())) ||
        f.folder === selectedFolder;

      return matchesSearch && matchesFolder;
    });
  }, [files, search, selectedFolder]);

  // Handle direct file upload from inside modal
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = await directUploadSingleFile(file);
      if (data && data.file) {
        toast.success('Uploaded to library!');
        setFiles((prev) => [data.file, ...prev]);
        setSelectedFile(data.file);
      } else {
        toast.error('Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmSelect = () => {
    if (!selectedFile) return;
    onSelect(selectedFile.imageUrl, selectedFile);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#c3943a]/10 text-[#c3943a] rounded-lg">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                {title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Select an existing image from your uploads or upload a new one.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>Upload New</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={fileType === 'video' ? 'video/*' : fileType === 'image' ? 'image/*' : '*/*'}
              className="hidden"
              onChange={handleQuickUpload}
            />

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Folder Chips */}
        <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800/60 bg-white dark:bg-neutral-900 flex flex-col sm:flex-row gap-2.5 items-center justify-between shrink-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-72 flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search file name..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs md:text-sm text-black dark:text-white placeholder:text-neutral-400 outline-none focus:border-[#c3943a] focus:ring-1 focus:ring-[#c3943a]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Folders Filter Chips */}
          <div className="w-full sm:w-auto flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedFolder('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all shrink-0 cursor-pointer ${
                selectedFolder === 'all'
                  ? 'bg-[#c3943a] text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              All Files ({files.length})
            </button>
            {folders.map((folder) => (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all shrink-0 cursor-pointer ${
                  selectedFolder === folder
                    ? 'bg-[#c3943a] text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid List */}
        <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2.5 text-neutral-400">
              <Loader2 className="w-7 h-7 animate-spin text-[#c3943a]" />
              <p className="text-xs font-medium">Loading media files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                <FileImage className="w-7 h-7 text-neutral-400" />
              </div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                No files found
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mb-4">
                {search
                  ? `No results matching "${search}".`
                  : 'No media files have been uploaded to this category yet.'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#c3943a] text-white rounded-lg hover:bg-[#a87b28] transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Your First File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                const isVideo = file.mimeType.startsWith('video/');

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    onDoubleClick={() => {
                      setSelectedFile(file);
                      onSelect(file.imageUrl, file);
                      onClose();
                    }}
                    className={`group relative flex flex-col rounded-xl border bg-white dark:bg-neutral-950 overflow-hidden cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'border-[#c3943a] ring-2 ring-[#c3943a] shadow-md shadow-[#c3943a]/20 -translate-y-0.5'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square w-full bg-neutral-100 dark:bg-neutral-900 overflow-hidden flex items-center justify-center">
                      {isVideo ? (
                        <div className="flex flex-col items-center gap-1 text-neutral-400">
                          <Film className="w-8 h-8" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Video</span>
                        </div>
                      ) : (
                        <img
                          src={file.imageUrl}
                          alt={file.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      )}

                      {/* Selected Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#c3943a] text-white flex items-center justify-center shadow-md animate-in zoom-in-50">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* File Size / Type Pill */}
                      <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-white">
                        {formatBytes(file.size)}
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2 flex flex-col gap-0.5">
                      <p
                        className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate leading-tight"
                        title={file.originalName}
                      >
                        {file.originalName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{file.folder || 'Root'}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[260px] sm:max-w-md">
            {selectedFile ? (
              <span className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {selectedFile.originalName}
                </span>
                <span className="text-neutral-400">({formatBytes(selectedFile.size)})</span>
              </span>
            ) : (
              <span>Double click or click an image to select it.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedFile}
              onClick={handleConfirmSelect}
              className="px-5 py-2 text-xs font-bold text-white bg-[#c3943a] hover:bg-[#a87b28] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Use Selected Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

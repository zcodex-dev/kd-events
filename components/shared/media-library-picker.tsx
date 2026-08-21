'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Folder, Image as ImageIcon, UploadCloud, ChevronRight, Check, Search, Plus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import type { UploadedFile } from '@/types';
import { directUploadSingleFile } from '@/lib/uploads/client-upload';
import { cn } from '@/lib/utils';

interface MediaLibraryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
}

export function MediaLibraryPicker({
  isOpen,
  onClose,
  onSelect,
  title = "Media Library",
}: MediaLibraryPickerProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all files on mount or when opened
  useEffect(() => {
    if (!isOpen) return;
    fetchFiles();
  }, [isOpen]);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/files?type=image');
      const data = await res.json();
      if (data.success) {
        setFiles(data.data);
      }
    } catch (error) {
      toast.error('Failed to load media library');
    } finally {
      setIsLoading(false);
    }
  };

  // Derived state
  const folders = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.folder) set.add(f.folder);
    });
    return Array.from(set).sort();
  }, [files]);

  const displayedFiles = useMemo(() => {
    let filtered = files;
    
    // Filter by folder
    if (currentFolder) {
      filtered = filtered.filter(f => f.folder === currentFolder);
    } else {
      // If we are at root, maybe we only show files without a folder? Or all files?
      // Let's show files without a folder at the root to mimic a real file system.
      filtered = filtered.filter(f => !f.folder);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(f => f.originalName.toLowerCase().includes(q));
    }

    return filtered;
  }, [files, currentFolder, searchQuery]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Must be image for logo picking usually, but we accept what's given.
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await directUploadSingleFile(file, {
        folder: currentFolder || undefined,
        onProgress: setUploadProgress,
      });

      // Add to local state immediately
      setFiles(prev => [result.file, ...prev]);
      toast.success('Uploaded successfully');
      
      // Auto-select if desired, or just let them click it
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    
    // We don't actually create empty folders in R2 metadata easily (it's driven by file properties).
    // So we just navigate into that folder. The folder will truly "exist" once a file is uploaded into it.
    setCurrentFolder(name);
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-neutral-900 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-neutral-200 dark:border-neutral-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{title}</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Select or upload an image</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Toolbar & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          
          <div className="flex items-center gap-2 text-sm">
            <button 
              onClick={() => setCurrentFolder(null)}
              className={cn(
                "hover:text-blue-600 transition-colors",
                !currentFolder ? "font-semibold text-neutral-900 dark:text-white" : "text-neutral-500"
              )}
            >
              Library
            </button>
            {currentFolder && (
              <>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
                <span className="font-semibold text-neutral-900 dark:text-white">{currentFolder}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search images..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleUpload}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span className="hidden sm:inline">{isUploading ? `${uploadProgress}%` : 'Upload'}</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50 dark:bg-neutral-950">
          
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading library...</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Folders Section (Only show if at root and no search) */}
              {!currentFolder && !searchQuery && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Folders</h3>
                    <button 
                      onClick={() => setIsCreatingFolder(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" /> New Folder
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    
                    {isCreatingFolder && (
                      <form onSubmit={handleCreateFolder} className="bg-white dark:bg-neutral-900 border border-blue-500 rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                        <Folder className="w-8 h-8 text-blue-500" fill="currentColor" fillOpacity={0.2} />
                        <input 
                          type="text" 
                          autoFocus
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          placeholder="Folder name"
                          className="w-full text-sm bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:outline-none focus:border-blue-500 pb-1"
                          onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                        />
                      </form>
                    )}

                    {folders.map(folder => (
                      <motion.button
                        key={folder}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentFolder(folder)}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl p-4 flex flex-col items-start gap-3 transition-colors shadow-sm text-left group"
                      >
                        <Folder className="w-8 h-8 text-neutral-400 group-hover:text-blue-500 transition-colors" fill="currentColor" fillOpacity={0.2} />
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-white truncate w-full">{folder}</p>
                          <p className="text-xs text-neutral-500">
                            {files.filter(f => f.folder === folder).length} files
                          </p>
                        </div>
                      </motion.button>
                    ))}

                    {!isCreatingFolder && folders.length === 0 && (
                      <div className="col-span-full text-sm text-neutral-500 py-4 italic">
                        No folders created yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Files Section */}
              <div>
                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-4">
                  {currentFolder ? `Files in ${currentFolder}` : (searchQuery ? 'Search Results' : 'Files')}
                </h3>
                
                {displayedFiles.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl border-dashed">
                    <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">No images found.</p>
                    {currentFolder && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 text-sm text-blue-600 font-medium hover:underline"
                      >
                        Upload the first image
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {displayedFiles.map(file => (
                      <motion.button
                        key={file.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onSelect(file.imageUrl);
                          onClose();
                        }}
                        className="group relative aspect-square bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
                      >
                        <Image 
                          src={file.imageUrl} 
                          alt={file.originalName} 
                          fill 
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          unoptimized
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white text-neutral-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            <Check className="w-3 h-3" /> Select
                          </div>
                        </div>
                        {/* Label */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                          <p className="text-xs font-medium text-white truncate shadow-sm">
                            {file.originalName}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Search, PackageOpen, FolderPlus, X } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import type { UploadedFile, FolderConfig } from '@/types';
import { formatFileSize } from '@/lib/uploads/file-utils';
import { EmptyState } from '@/components/shared/empty-state';
import { AnimatedFolder } from '@/components/ui/3d-folder';
import { useRouter } from 'next/navigation';
import { resolveUrl } from '@/lib/uploads/file-utils';
import { toast } from 'sonner';

type FolderStats = {
  name: string;
  fileCount: number;
  totalSize: number;
  files: UploadedFile[];
  color?: string;
};

export default function FoldersPage() {
  const { openSidebar } = useDashboard();
  const router = useRouter();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [folders, setFolders] = useState<FolderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // New folder modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('');
  const [parentFolder, setParentFolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        fetch(`/api/files`),
        fetch(`/api/folders`)
      ]);
      const filesData = await filesRes.json();
      const foldersData = await foldersRes.json();

      if (filesData.success) setFiles(filesData.data);
      if (foldersData.success) setFolders(foldersData.data);
    } catch {
      //
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setIsSubmitting(true);
    try {
      const finalName = parentFolder ? `${parentFolder}/${newFolderName.trim()}` : newFolderName.trim();
      
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, color: newFolderColor }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Folder created successfully');
        setIsModalOpen(false);
        setNewFolderName('');
        setNewFolderColor('');
        setParentFolder('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to create folder');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const folderStats = useMemo(() => {
    const stats: Record<string, FolderStats> = {};

    // Initialize stats with pre-configured folders
    folders.forEach(f => {
      stats[f.name] = { name: f.name, fileCount: 0, totalSize: 0, files: [], color: f.color };
    });

    files.forEach(file => {
      if (!file.folder) return;
      if (!stats[file.folder]) {
        stats[file.folder] = { name: file.folder, fileCount: 0, totalSize: 0, files: [] };
      }
      stats[file.folder].fileCount += 1;
      stats[file.folder].totalSize += file.size;
      stats[file.folder].files.push(file);
    });

    return Object.values(stats)
      .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [files, folders, searchQuery]);

  return (
    <>
      <Header
        title="Manage Folders"
        description="View and organize your media folders"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-6"
      >
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-80 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg shadow-sm overflow-hidden">
            <div className="pl-3 py-2 text-neutral-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2 py-2 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-neutral-900 dark:text-white"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors w-full sm:w-auto"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
        </div>

        {/* Folders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : folderStats.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No folders found"
            description="You haven't created any folders yet. You can create a folder by assigning a file to it in the Media Library."
            action={{
              label: 'Go to Library',
              href: '/dashboard/files'
            }}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8 py-8 w-full">
            {folderStats.map(folder => {
              const projects = folder.files.slice(0, 3).map(f => ({
                id: f.id,
                image: resolveUrl(f.imageUrl),
                title: f.originalName
              }));

              return (
                <AnimatedFolder
                  key={folder.name}
                  title={folder.name.split('/').pop() || folder.name}
                  projects={projects}
                  color={folder.color}
                  onClick={() => router.push(`/dashboard/files?folder=${encodeURIComponent(folder.name)}`)}
                />
              )
            })}
          </div>
        )}
      </motion.div>

      {/* New Folder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Create New Folder</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g., Kompong Dewa Event 2026...."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Parent Folder (Optional)
                </label>
                <select
                  value={parentFolder}
                  onChange={(e) => setParentFolder(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">None (Top Level)</option>
                  {folders.map(f => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Folder Color (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newFolderColor || '#3b82f6'}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    className="w-10 h-10 p-1 border border-neutral-300 dark:border-neutral-700 rounded-lg cursor-pointer bg-white dark:bg-neutral-900"
                  />
                  <input
                    type="text"
                    value={newFolderColor}
                    onChange={(e) => setNewFolderColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm uppercase"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newFolderName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  );
}

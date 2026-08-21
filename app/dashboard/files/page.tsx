'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, List, LayoutGrid } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { RecentUploadsTable } from '@/components/dashboard/recent-uploads-table';
import { useDashboard } from '@/app/dashboard/layout';
import type { UploadedFile } from '@/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FilesPageContent() {
  const { openSidebar } = useDashboard();
  const searchParams = useSearchParams();
  const folderQuery = searchParams.get('folder') || '';
  
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState(folderQuery);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const folders = useMemo(() => {
    return Array.from(new Set(files.map(f => f.folder).filter(Boolean))) as string[];
  }, [files]);

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (sortBy) params.set('sort', sortBy);
      if (typeFilter) params.set('type', typeFilter);
      if (folderFilter) params.set('folder', folderFilter);

      const res = await fetch(`/api/files?${params.toString()}`);
      const data = await res.json();
      if (data.success) setFiles(data.data);
    } catch {
      // Will show empty state
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy, typeFilter, folderFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchFiles, 300);
    return () => clearTimeout(debounce);
  }, [fetchFiles]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Media Library</h1>
          <Link 
            href="/dashboard/upload"
            className="px-3 py-1 text-sm font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Add Media File
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-6"
      >
        {/* WordPress-style Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            {/* Folder Dropdown */}
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-blue-500 rounded shadow-sm"
            >
              <option value="">All media items</option>
              {folders.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {/* Type Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-blue-500 rounded shadow-sm"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Video</option>
            </select>
            
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-blue-500 rounded shadow-sm"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 w-full sm:w-64">
            <label className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Search media</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Table / Grid */}
        <RecentUploadsTable
          files={files}
          isLoading={isLoading}
          onRefresh={fetchFiles}
          viewMode={viewMode}
        />
      </motion.div>
    </>
  );
}

export default function AllFilesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading files...</div>}>
      <FilesPageContent />
    </Suspense>
  );
}

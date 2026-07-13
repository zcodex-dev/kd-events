'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { RecentUploadsTable } from '@/components/dashboard/recent-uploads-table';
import { useDashboard } from '@/app/dashboard/layout';
import type { UploadedFile } from '@/types';

export default function AllFilesPage() {
  const { openSidebar } = useDashboard();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (sortBy) params.set('sort', sortBy);
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`/api/files?${params.toString()}`);
      const data = await res.json();
      if (data.success) setFiles(data.data);
    } catch {
      // Will show empty state
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, sortBy, typeFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchFiles, 300);
    return () => clearTimeout(debounce);
  }, [fetchFiles]);

  return (
    <>
      <Header
        title="All Files"
        description="Manage all uploaded files"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-4"
      >
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-md">
            <Search className="w-4 h-4 text-neutral-400 ml-3" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2.5 text-sm text-neutral-900 dark:text-white bg-transparent border-none focus:outline-none placeholder:text-neutral-500"
              aria-label="Search files"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-blue-500 rounded-md"
              aria-label="Filter by type"
            >
              <option value="">All Types</option>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-blue-500 rounded-md"
              aria-label="Sort by"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="largest">Largest</option>
              <option value="smallest">Smallest</option>
              <option value="most-viewed">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* File count */}
        {!isLoading && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {files.length} file{files.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        )}

        {/* Table */}
        <RecentUploadsTable
          files={files}
          isLoading={isLoading}
          onRefresh={fetchFiles}
        />
      </motion.div>
    </>
  );
}

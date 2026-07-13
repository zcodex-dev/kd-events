'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentUploadsTable } from '@/components/dashboard/recent-uploads-table';
import { useDashboard } from '@/app/dashboard/layout';
import type { DashboardStats, UploadedFile } from '@/types';

export default function DashboardPage() {
  const { openSidebar } = useDashboard();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/files?stats=true');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {
      // Stats are non-critical
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) setFiles(data.data);
    } catch {
      // Will show empty state
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchFiles();
  }, [fetchStats, fetchFiles]);

  const handleRefresh = () => {
    fetchStats();
    fetchFiles();
  };

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of your uploaded files"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-6"
      >
        {/* Stats */}
        <StatsCards stats={stats} isLoading={isLoadingStats} />

        {/* Recent uploads */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Recent Uploads
            </h2>
            <Link
              href="/dashboard/upload"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </Link>
          </div>
          <RecentUploadsTable
            files={files}
            isLoading={isLoadingFiles}
            onRefresh={handleRefresh}
            limit={10}
          />
        </div>
      </motion.div>
    </>
  );
}

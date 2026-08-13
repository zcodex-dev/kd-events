'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { Edit, Ban, Trash2, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { openSidebar } = useDashboard();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/registrations');
      const data = await res.json();
      if (data.success) {
        setStats(data.data.stats);
      }
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  return (
    <>
      <Header
        title="Event Admin Dashboard"
        description="Manage your event registrations"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-6"
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
            <h3 className="text-neutral-500 text-sm">Total Registered</h3>
            <p className="text-3xl font-black mt-2">{stats?.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
            <h3 className="text-neutral-500 text-sm">KD Members</h3>
            <p className="text-3xl font-black mt-2 text-[#c3943a]">{stats?.members || 0}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl">
            <h3 className="text-neutral-500 text-sm">Non-Members</h3>
            <p className="text-3xl font-black mt-2">{stats?.nonMembers || 0}</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}

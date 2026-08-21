'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { PieChart, Users, ArrowRight, HardDrive } from 'lucide-react';
import { formatFileSize } from '@/lib/uploads/file-utils';
import type { SubUser, UploadedFile } from '@/types';

export default function DashboardPage() {
  const { openSidebar, session } = useDashboard();
  const [stats, setStats] = useState<any>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [users, setUsers] = useState<SubUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [regRes, filesRes, usersRes] = await Promise.all([
        fetch('/api/admin/registrations'),
        fetch('/api/files'),
        fetch('/api/users'),
      ]);
      const regData = await regRes.json();
      const filesData = await filesRes.json();
      const usersData = await usersRes.json();

      if (regData.success) setStats(regData.data.stats);
      if (filesData.success) setFiles(filesData.data);
      if (usersData.success && Array.isArray(usersData.data)) setUsers(usersData.data);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalStorageBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalStorageGB = (totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
  const maxStorageGB = 10; // e.g. 10GB limit
  const storagePercentage = Math.min((parseFloat(totalStorageGB) / maxStorageGB) * 100, 100);

  return (
    <>
      <Header
        title="Event Admin Dashboard"
        description="Manage your event activities and storage"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-6 w-full"
      >
        {/* Registration Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-5 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Registered</h3>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">{stats?.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-5 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">KD Members</h3>
            <p className="text-3xl font-black text-[#c3943a]">{stats?.members || 0}</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800 p-5 rounded-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="text-neutral-500 dark:text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">Non-Members</h3>
            <p className="text-3xl font-black text-neutral-900 dark:text-white">{stats?.nonMembers || 0}</p>
          </div>
        </div>

        {/* Dashboard Activities Container */}
        <div className="bg-white dark:bg-[#1c1c1c] border border-neutral-200/50 dark:border-transparent p-6 rounded-3xl text-neutral-900 dark:text-white shadow-[inset_0_2px_12px_rgba(0,0,0,0.04),0_2px_6px_rgba(0,0,0,0.02)] dark:shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Dashboard Activities</h2>
            <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors">
              <PieChart className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Storage Monitoring Card */}
            <div className="bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-[#333] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-neutral-500 dark:text-[#a1a1aa] text-sm font-medium">Storage Monitoring</h3>
                <HardDrive className="w-5 h-5 text-neutral-400 dark:text-[#71717a]" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold tracking-tight">{totalStorageGB}</span>
                <span className="text-neutral-500 dark:text-[#a1a1aa] text-lg font-medium">GB used</span>
              </div>

              {/* Progress Bar */}
              <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-neutral-200 dark:bg-[#3f3f46] mb-4">
                <div style={{ width: `${storagePercentage}%` }} className="bg-[#10b981]" />
                <div style={{ width: '20%' }} className="bg-[#a3e635]" />
                <div style={{ width: '10%' }} className="bg-[#fbbf24]" />
              </div>

              <div className="flex gap-4 text-xs font-medium text-neutral-500 dark:text-[#71717a]">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10b981]" /> Images</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#a3e635]" /> Videos</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#fbbf24]" /> Docs</div>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="bg-green-50 dark:bg-[#1a2e1a] border border-green-200 dark:border-[#2b4c2b] rounded-2xl p-6 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-green-700 dark:text-[#a3e635] text-sm font-medium">Team Members</h3>
                <Users className="w-5 h-5 text-green-600 dark:text-[#a3e635]" />
              </div>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">{users.length}</span>
                <span className="text-green-700 dark:text-[#a3e635] text-lg font-medium">members</span>
              </div>

              {/* Avatar Stack */}
              <div className="flex -space-x-2">
                {users.slice(0, 5).map((user, i) => (
                  <div key={user.id} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#1a2e1a] bg-green-200 dark:bg-[#2b4c2b] flex items-center justify-center overflow-hidden z-10" style={{ zIndex: 10 - i }}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.nickname || user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-green-800 dark:text-white uppercase">{(user.nickname || user.username).slice(0,2)}</span>
                    )}
                  </div>
                ))}
                {users.length > 5 && (
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#1a2e1a] bg-green-600 dark:bg-[#3f6e3f] flex items-center justify-center text-white text-xs font-bold z-0">
                    +{users.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-transparent rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-neutral-600 dark:text-[#a1a1aa]">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-[#333] flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-neutral-600 dark:text-white" />
              </div>
              <span className="text-sm font-medium">Manage your storage and team members</span>
            </div>
            <a href="/dashboard/users" className="bg-neutral-900 dark:bg-[#e4e4e7] hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
              See All <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.div>
    </>
  );
}

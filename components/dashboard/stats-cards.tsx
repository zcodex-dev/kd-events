'use client';

import { motion } from 'framer-motion';
import { Files, Eye, CalendarDays, HardDrive } from 'lucide-react';
import type { DashboardStats } from '@/types';
import { formatFileSize } from '@/lib/uploads/file-utils';

type StatsCardsProps = {
  stats: DashboardStats | null;
  isLoading: boolean;
};

const statItems = [
  {
    key: 'totalFiles' as const,
    label: 'Total Files',
    icon: Files,
    format: (v: number) => v.toString(),
  },
  {
    key: 'totalViews' as const,
    label: 'Total Views',
    icon: Eye,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'todayUploads' as const,
    label: 'Uploaded Today',
    icon: CalendarDays,
    format: (v: number) => v.toString(),
  },
  {
    key: 'storageUsed' as const,
    label: 'Storage Used',
    icon: HardDrive,
    format: (v: number) => formatFileSize(v),
  },
];

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white border border-neutral-200 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {item.label}
              </span>
              <Icon className="w-4 h-4 text-neutral-400" strokeWidth={1.75} />
            </div>
            <div className="text-2xl font-semibold text-neutral-900">
              {isLoading ? (
                <div className="h-8 w-16 bg-neutral-100 animate-pulse" />
              ) : (
                item.format(stats?.[item.key] ?? 0)
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { ScreenForm } from '@/components/dashboard/screen-form';
import { LoadingSpinner } from '@/components/shared/loading';
import type { TvScreen } from '@/types';

export default function EditTvScreenPage() {
  const params = useParams();
  const { openSidebar } = useDashboard();
  const [screen, setScreen] = useState<TvScreen | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScreen = async () => {
      try {
        const res = await fetch(`/api/screens/${params.id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setScreen(data.data);
        } else {
          toast.error(data.error || 'Failed to load TV display screen');
        }
      } catch {
        toast.error('Error fetching TV screen');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchScreen();
    }
  }, [params.id]);

  return (
    <>
      <Header
        title="Edit TV Display Screen"
        description="Update event promotion details, background media, and jackpot counter"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 max-w-[1850px] mx-auto"
      >
        {isLoading ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-2 shadow-xs">
            <LoadingSpinner size={24} />
            <span className="text-xs text-neutral-500 font-medium">Loading TV display settings...</span>
          </div>
        ) : screen ? (
          <ScreenForm initialData={screen} isEdit />
        ) : (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 text-center shadow-xs">
            <p className="text-sm font-semibold text-neutral-800 dark:text-white">TV Display Screen Not Found</p>
          </div>
        )}
      </motion.div>
    </>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { ScreenForm } from '@/components/dashboard/screen-form';

export default function CreateTvScreenPage() {
  const { openSidebar } = useDashboard();

  return (
    <>
      <Header
        title="Create TV Display Screen"
        description="Configure dynamic digital signage for physical LCD and TV screens"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 max-w-[1850px] mx-auto"
      >
        <ScreenForm />
      </motion.div>
    </>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { PageForm } from '@/components/dashboard/page-form';
import { ShieldAlert } from 'lucide-react';

export default function CreateWebPage() {
  const { openSidebar, session } = useDashboard();

  if (session && session.role !== 'admin') {
    return (
      <>
        <Header title="Create Web Page" onMenuClick={openSidebar} />
        <div className="max-w-md mx-auto mt-20 p-6 bg-white border border-neutral-200 rounded-2xl shadow-sm text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-base font-bold text-neutral-900">Access Denied</h2>
          <p className="text-xs text-neutral-500 mt-2">
            Only administrators can create web pages.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Create Web Page"
        description="Design a new Terms & Conditions or custom page"
        onMenuClick={openSidebar}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 max-w-4xl mx-auto"
      >
        <PageForm />
      </motion.div>
    </>
  );
}

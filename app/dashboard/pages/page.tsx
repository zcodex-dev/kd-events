'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FileText, Plus, Trash2, Edit3, ExternalLink } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { LoadingSpinner } from '@/components/shared/loading';
import type { WebPage } from '@/types';
import Link from 'next/link';

export default function WebPagesPage() {
  const { openSidebar, session } = useDashboard();
  const [pages, setPages] = useState<WebPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success) {
        setPages(data.data || []);
      } else {
        toast.error(data.error || 'Failed to load web pages');
      }
    } catch {
      toast.error('Error fetching web pages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPages();
    }
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this web page? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Web page deleted successfully');
        fetchPages();
      } else {
        toast.error(data.error || 'Failed to delete web page');
      }
    } catch {
      toast.error('Network error during deletion');
    }
  };

  const isAdmin = session?.role === 'admin';

  return (
    <>
      <Header
        title="Web Pages"
        description="Manage Terms & Conditions and other dynamic web views"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 w-full space-y-6"
      >
        {/* Header Bar */}
        <div className="flex justify-between items-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            <div>
              <h2 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">Custom Web Pages</h2>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Total pages: {pages.length}</p>
            </div>
          </div>
          {isAdmin && (
            <Link
              href="/dashboard/pages/create"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Page
            </Link>
          )}
        </div>

        {/* Pages List */}
        {isLoading ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 flex flex-col items-center justify-center gap-2 shadow-sm">
            <LoadingSpinner size={24} />
            <span className="text-xs text-neutral-500 font-medium">Loading pages...</span>
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-12 text-center shadow-sm">
            <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">No web pages yet</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 mb-4">Create your first Terms & Conditions page to share.</p>
            {isAdmin && (
              <Link
                href="/dashboard/pages/create"
                className="px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors rounded-lg font-medium inline-block"
              >
                Create New Page
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <div key={page.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {page.featureIconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={page.featureIconUrl} alt="" className="w-8 h-8 object-contain rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">{page.title}</h3>
                      <p className="text-[10px] text-neutral-400 dark:text-neutral-500">/{page.slug}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    <span>{page.viewCount} views</span>
                    <span>{new Date(page.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <a
                    href={page.shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Page
                  </a>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/pages/${page.id}/edit`}
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit Page"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(page.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}

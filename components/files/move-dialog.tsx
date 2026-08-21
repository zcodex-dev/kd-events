'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, FolderInput } from 'lucide-react';
import { toast } from 'sonner';
import type { UploadedFile } from '@/types';

type MoveDialogProps = {
  files: UploadedFile[] | null;
  onClose: () => void;
  onSuccess: () => void;
  existingFolders: string[];
};

export function MoveDialog({ files, onClose, onSuccess, existingFolders }: MoveDialogProps) {
  const [folder, setFolder] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const [customFolder, setCustomFolder] = useState('');

  // Initialize input when modal opens
  if (files && files.length > 0 && !initialized) {
    const defaultFolder = files.length === 1 ? (files[0].folder || '') : '';
    setFolder(existingFolders.includes(defaultFolder) ? defaultFolder : (defaultFolder ? 'custom' : ''));
    if (defaultFolder && !existingFolders.includes(defaultFolder)) {
      setCustomFolder(defaultFolder);
    }
    setInitialized(true);
  }
  
  if ((!files || files.length === 0) && initialized) {
    setInitialized(false);
    setFolder('');
    setCustomFolder('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return;

    setIsSubmitting(true);
    const targetFolder = folder === 'custom' ? customFolder.trim() : folder.trim();

    try {
      // Move all files sequentially to avoid data races in JSON metadata
      for (const f of files) {
        await fetch(`/api/files/${f.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder: targetFolder || null }),
        });
      }

      toast.success(`Moved ${files.length} file(s) to ${targetFolder || 'root'}`);
      onSuccess();
      onClose();
    } catch {
      toast.error('Network error while moving file(s)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {files && files.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl z-50 overflow-hidden border border-neutral-200 dark:border-neutral-800"
          >
            <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FolderInput className="w-5 h-5 text-neutral-500" />
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Move {files.length > 1 ? `${files.length} Files` : 'File'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Select Destination Folder
                </label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-2 mb-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-neutral-900 dark:text-white"
                >
                  <option value="">Root (Remove from folder)</option>
                  {existingFolders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="custom">Type new folder name...</option>
                </select>

                {folder === 'custom' && (
                  <input
                    type="text"
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                    placeholder="e.g. Banners, Campaigns..."
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-neutral-900 dark:text-white"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Move File'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

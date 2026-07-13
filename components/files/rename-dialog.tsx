'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { renameSchema, type RenameFormData } from '@/lib/validation/schemas';
import type { UploadedFile } from '@/types';

type RenameDialogProps = {
  file: UploadedFile | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function RenameDialog({ file, onClose, onSuccess }: RenameDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RenameFormData>({
    resolver: zodResolver(renameSchema),
    values: file ? { name: file.originalName } : undefined,
  });

  const onSubmit = async (data: RenameFormData) => {
    if (!file) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: data.name }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success('File renamed');
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || 'Failed to rename');
      }
    } catch {
      toast.error('Failed to rename file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {file && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white border border-neutral-200 w-full max-w-md p-6 rounded-xl shadow-xl z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-semibold text-neutral-900 mb-4">
              Rename file
            </h3>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label
                  htmlFor="rename-input"
                  className="block text-xs font-medium text-neutral-500 mb-1.5"
                >
                  File name
                </label>
                <input
                  id="rename-input"
                  type="text"
                  {...register('name')}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 bg-white text-neutral-900 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-neutral-700 border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

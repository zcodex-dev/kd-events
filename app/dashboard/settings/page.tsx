'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Save, Check, FileCode2 } from 'lucide-react';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { LoadingSpinner } from '@/components/shared/loading';

// Define the available extensions
const IMAGE_TYPES = [
  { id: 'image/jpeg', ext: '.jpg, .jpeg', label: 'JPEG / JPG' },
  { id: 'image/png', ext: '.png', label: 'PNG' },
  { id: 'image/webp', ext: '.webp', label: 'WebP' },
  { id: 'image/svg+xml', ext: '.svg', label: 'SVG (Vector)' },
  { id: 'image/gif', ext: '.gif', label: 'GIF (Animated)' },
];

export default function SettingsPage() {
  const { openSidebar } = useDashboard();
  const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch the configuration on mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data?.allowedTypes) {
          setAllowedTypes(resData.data.allowedTypes);
        } else {
          toast.error('Failed to load settings');
        }
      })
      .catch(() => {
        toast.error('Error connecting to settings API');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleToggle = (id: string) => {
    setAllowedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (allowedTypes.length === 0) {
      toast.error('You must allow at least one file type.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedTypes }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Upload settings saved successfully');
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header
        title="Settings"
        description="Configure application upload controls"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 max-w-2xl"
      >
        <div className="bg-white border border-neutral-200">
          {/* Section Header */}
          <div className="px-5 py-4 border-b border-neutral-200 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Allowed File Formats
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Enable or disable specific file extensions for uploads.
              </p>
            </div>
          </div>

          {/* Form */}
          {isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size={24} />
              <span className="text-xs text-neutral-500">Loading settings...</span>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                {IMAGE_TYPES.map((t) => {
                  const isChecked = allowedTypes.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggle(t.id)}
                      className="flex items-center justify-between p-3 border border-neutral-200 hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-900">
                          {t.label}
                        </span>
                        <code className="text-xs text-neutral-500 mt-0.5">
                          {t.ext}
                        </code>
                      </div>

                      {/* Custom Checkbox */}
                      <div
                        className={`w-5 h-5 border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-neutral-900 border-neutral-900 text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

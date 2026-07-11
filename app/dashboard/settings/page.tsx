'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/shared/header';
import { useDashboard } from '@/app/dashboard/layout';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const envVars = [
  { key: 'GITHUB_TOKEN', label: 'GitHub Token', sensitive: true },
  { key: 'GITHUB_OWNER', label: 'GitHub Owner', sensitive: false },
  { key: 'GITHUB_REPO', label: 'GitHub Repository', sensitive: false },
  { key: 'GITHUB_BRANCH', label: 'GitHub Branch', sensitive: false },
  { key: 'GITHUB_UPLOAD_FOLDER', label: 'Upload Folder', sensitive: false },
  { key: 'NEXT_PUBLIC_APP_URL', label: 'Application URL', sensitive: false },
  { key: 'ADMIN_PASSWORD', label: 'Admin Password', sensitive: true },
];

export default function SettingsPage() {
  const { openSidebar } = useDashboard();

  return (
    <>
      <Header
        title="Settings"
        description="Application configuration"
        onMenuClick={openSidebar}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 space-y-6"
      >
        {/* Environment Variables */}
        <div className="bg-white border border-neutral-200">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900">
              Environment Configuration
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              These values are configured via environment variables on your deployment.
            </p>
          </div>

          <div className="divide-y divide-neutral-100">
            {envVars.map((v) => {
              // Check if env var is set (server-side only, so we only check public ones)
              const isPublic = v.key.startsWith('NEXT_PUBLIC_');
              const value = isPublic
                ? process.env[v.key as keyof typeof process.env]
                : undefined;

              return (
                <div
                  key={v.key}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-neutral-900">{v.label}</p>
                    <code className="text-xs text-neutral-500">{v.key}</code>
                  </div>
                  {isPublic ? (
                    value ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Set
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Not set
                      </div>
                    )
                  ) : (
                    <span className="text-xs text-neutral-400">Server-only</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* File Upload Config */}
        <div className="bg-white border border-neutral-200">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900">
              Upload Configuration
            </h2>
          </div>
          <div className="divide-y divide-neutral-100">
            <SettingRow label="Max File Size" value="10 MB" />
            <SettingRow label="Accepted Formats" value="JPG, PNG, WebP" />
            <SettingRow label="Storage" value="GitHub Repository" />
            <SettingRow label="Metadata" value="JSON Index (data/uploads.json)" />
          </div>
        </div>
      </motion.div>
    </>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className="text-sm text-neutral-900 font-medium">{value}</span>
    </div>
  );
}

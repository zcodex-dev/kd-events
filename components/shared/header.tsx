'use client';

import { useRouter } from 'next/navigation';
import { Menu, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/shared/theme-toggle';

type HeaderProps = {
  title: string;
  description?: string;
  onMenuClick: () => void;
};

export function Header({ title, description, onMenuClick }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
      } else {
        toast.error('Failed to logout');
      }
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-neutral-200 bg-white dark:bg-neutral-900 dark:border-neutral-800 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800 rounded-md transition-colors duration-150"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  Settings,
  Users as UsersIcon,
  ImageIcon,
  X,
} from 'lucide-react';
import type { SessionData } from '@/types';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload Files', href: '/dashboard/upload', icon: Upload, requiredPermission: 'canUpload' },
  { label: 'All Files', href: '/dashboard/files', icon: FolderOpen },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, adminOnly: true },
  { label: 'Users', href: '/dashboard/users', icon: UsersIcon, adminOnly: true },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  session: SessionData | null;
};

export function Sidebar({ isOpen, onClose, session }: SidebarProps) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && session?.role !== 'admin') return false;
    if (item.requiredPermission && session) {
      const permissionName = item.requiredPermission as keyof typeof session.permissions;
      if (!session.permissions[permissionName]) {
        return false;
      }
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="logo-container-sweep">
              <Image
                src="/logo.png"
                alt="Logo"
                width={24}
                height={24}
                className="h-6 w-auto shrink-0 object-contain"
                unoptimized
              />
              <div className="logo-sweep-overlay" />
            </div>
            <span className="font-bold text-[13px] gold-gradient-text tracking-wide uppercase">
              KOMPONG DEWA EVENTS
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-neutral-400 hover:text-neutral-600"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                      transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }
                    `}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}

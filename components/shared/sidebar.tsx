'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  FolderOpen,
  Settings,
  Users as UsersIcon,
  FileText,
  Tv,
  X,
  ClipboardList,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { SessionData } from '@/types';

type NavChildItem = {
  label: string;
  href: string;
  icon?: any;
  requiredPermission?: string;
  adminOnly?: boolean;
};

type NavItem = {
  label: string;
  href?: string;
  icon: any;
  requiredPermission?: string;
  adminOnly?: boolean;
  children?: NavChildItem[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Upload Files', href: '/dashboard/upload', icon: Upload, requiredPermission: 'canUpload' },
  { label: 'All Files', href: '/dashboard/files', icon: FolderOpen },
  { label: 'Event Form', href: '/event/registration', icon: ClipboardList, adminOnly: true },
  {
    label: 'Event Management',
    icon: Calendar,
    adminOnly: true,
    children: [
      { label: 'Events List', href: '/dashboard/events', icon: ClipboardList, adminOnly: true },
      { label: 'Manage Players', href: '/dashboard/events/players', icon: UsersIcon, adminOnly: true },
    ],
  },
  { label: 'Web Pages', href: '/dashboard/pages', icon: FileText, adminOnly: true },
  { label: 'TV Displays', href: '/dashboard/screens', icon: Tv, adminOnly: true },
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

  // State to track expanded sub-menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Automatically expand parent if current route matches any child
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => pathname === child.href || (child.href !== '/dashboard' && pathname.startsWith(child.href))
        );
        if (isChildActive) {
          setOpenMenus((prev) => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
          fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="logo-container-sweep">
              <Image
                src="/logo.png"
                alt="Logo"
                width={160}
                height={40}
                className="h-10 w-auto shrink-0 object-contain"
                unoptimized
              />
              <div className="logo-sweep-overlay" />
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                const filteredChildren = item.children.filter((child) => {
                  if (child.adminOnly && session?.role !== 'admin') return false;
                  if (child.requiredPermission && session) {
                    const permissionName = child.requiredPermission as keyof typeof session.permissions;
                    if (!session.permissions[permissionName]) return false;
                  }
                  return true;
                });

                const isParentActive = filteredChildren.some(
                  (child) => pathname === child.href || pathname.startsWith(child.href)
                );
                const isExpanded = openMenus[item.label] ?? isParentActive;

                return (
                  <li key={item.label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.label)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium
                        transition-colors duration-150 rounded-md select-none
                        ${
                          isParentActive
                            ? 'bg-blue-50/70 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        <span>{item.label}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>

                    {/* Submenu Children */}
                    {isExpanded && (
                      <ul className="pl-6 space-y-1 border-l-2 border-neutral-200 dark:border-neutral-800 ml-4 my-1">
                        {filteredChildren.map((child) => {
                          const isChildActive =
                            pathname === child.href ||
                            (child.href !== '/dashboard' && pathname.startsWith(child.href));
                          const ChildIcon = child.icon;

                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                onClick={onClose}
                                className={`
                                  flex items-center gap-2.5 px-3 py-2 text-xs font-medium
                                  transition-colors duration-150 rounded-md
                                  ${
                                    isChildActive
                                      ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
                                  }
                                `}
                              >
                                {ChildIcon && <ChildIcon className="w-4 h-4 shrink-0" strokeWidth={1.75} />}
                                <span>{child.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const isActive =
                item.href &&
                (pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href)));

              return (
                <li key={item.href || item.label}>
                  <Link
                    href={item.href || '#'}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 text-sm font-medium
                      transition-colors duration-150 rounded-md
                      ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100'
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

'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import type { SessionData } from '@/types';
import { LoadingSpinner } from '@/components/shared/loading';
import { useRouter } from 'next/navigation';

type DashboardContextType = {
  openSidebar: () => void;
  session: SessionData | null;
  isLoading: boolean;
};

const DashboardContext = createContext<DashboardContextType>({
  openSidebar: () => {},
  session: null,
  isLoading: true,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.success && data.data) {
          setSession(data.data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 gap-3">
        <LoadingSpinner size={32} />
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 font-sans">
          Loading events console...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 font-sans transition-colors">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        session={session}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Children must handle their own header with onMenuClick */}
        <main className="flex-1 overflow-y-auto">
          <DashboardContext.Provider
            value={{ 
              openSidebar: () => setSidebarOpen(true),
              session,
              isLoading
            }}
          >
            {children}
          </DashboardContext.Provider>
        </main>
      </div>
    </div>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}

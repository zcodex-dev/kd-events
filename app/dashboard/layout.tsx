'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/shared/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Children must handle their own header with onMenuClick */}
        <main className="flex-1 overflow-y-auto">
          {typeof children === 'object' && children !== null
            ? (() => {
                // Pass sidebarOpen state to children via a wrapper
                return (
                  <DashboardContext.Provider
                    value={{ openSidebar: () => setSidebarOpen(true) }}
                  >
                    {children}
                  </DashboardContext.Provider>
                );
              })()
            : children}
        </main>
      </div>
    </div>
  );
}

// Context to pass sidebar toggle to child pages
import { createContext, useContext } from 'react';

type DashboardContextType = {
  openSidebar: () => void;
};

const DashboardContext = createContext<DashboardContextType>({
  openSidebar: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}

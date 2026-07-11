'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#ffffff',
          border: '1px solid #e5e5e5',
          color: '#171717',
          fontSize: '14px',
        },
      }}
      closeButton
    />
  );
}

import React from 'react';
import { PublicNav } from '@/components/showcase/public-nav';
import { PublicFooter } from '@/components/showcase/public-footer';
import { LanguageProvider } from '@/lib/showcase/language-context';

export function ShowcaseShell({
  children,
  isEmbed = false,
}: {
  children: React.ReactNode;
  isEmbed?: boolean;
}) {
  return (
    <div className="bg-[#101010] text-[#f3f3f3] min-h-screen flex flex-col font-sans selection:bg-[#c3943a]/30 selection:text-white">
      <LanguageProvider>
        {!isEmbed && <PublicNav />}
        <main className="flex-1">{children}</main>
        {!isEmbed && <PublicFooter />}
      </LanguageProvider>
    </div>
  );
}

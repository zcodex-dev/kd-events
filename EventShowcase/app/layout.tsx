import type { Metadata } from 'next';
import './globals.css';
import { PublicNav } from '@/components/public-nav';
import { PublicFooter } from '@/components/public-footer';
import { LanguageProvider } from '@/lib/language-context';

export const metadata: Metadata = {
  title: 'Kompong Dewa Integrated Resort — Events & Tournaments',
  description: 'Discover luxury casino tournaments, progressive poker jackpots, and premier entertainment events at Kompong Dewa Resort.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-[#101010] scroll-smooth" suppressHydrationWarning>
      <body className="bg-[#101010] text-[#f3f3f3] min-h-screen flex flex-col">
        <LanguageProvider>
          <PublicNav />
          <main className="flex-1">{children}</main>
          <PublicFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}

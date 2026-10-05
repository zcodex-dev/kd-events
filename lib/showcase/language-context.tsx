'use client';

import React, { createContext, useContext, useState, useEffect, useTransition, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type Locale = 'en' | 'id' | 'zh';

export const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'id', label: 'Bahasa', flag: 'https://flagcdn.com/w40/id.png' },
  { code: 'zh', label: 'Chinese', flag: 'https://flagcdn.com/w40/cn.png' },
];

type LanguageContextValue = {
  currentLang: Locale;
  changeLang: (lang: Locale) => void;
  setEventDefaultLang: (lang?: string | null) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  currentLang: 'en',
  changeLang: () => {},
  setEventDefaultLang: () => {},
});

function LanguageProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [eventDefaultLang, setEventDefaultLangState] = useState<Locale>('en');

  // Reset event default language when navigating away from event detail page
  useEffect(() => {
    if (!pathname || !pathname.startsWith('/events/')) {
      setEventDefaultLangState('en');
    }
  }, [pathname]);

  const queryLang = searchParams?.get('lang') as Locale | null;
  const currentLang: Locale =
    queryLang && ['en', 'id', 'zh'].includes(queryLang)
      ? queryLang
      : eventDefaultLang;

  const setEventDefaultLang = (lang?: string | null) => {
    if (lang && ['en', 'id', 'zh'].includes(lang)) {
      setEventDefaultLangState(lang as Locale);
    } else {
      setEventDefaultLangState('en');
    }
  };

  const changeLang = (lang: Locale) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('lang', lang);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <LanguageContext.Provider value={{ currentLang, changeLang, setEventDefaultLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <LanguageProviderInner>{children}</LanguageProviderInner>
    </Suspense>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

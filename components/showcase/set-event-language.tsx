'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/showcase/language-context';

export function SetEventLanguage({ defaultLang }: { defaultLang?: string | null }) {
  const { setEventDefaultLang } = useLanguage();

  useEffect(() => {
    setEventDefaultLang(defaultLang);
  }, [defaultLang, setEventDefaultLang]);

  return null;
}

'use client';

import React from 'react';
import { useLanguage, LANGUAGES } from '@/lib/showcase/language-context';

export function EventLanguagePills() {
  const { currentLang, changeLang } = useLanguage();

  return (
    <div className="inline-flex items-center bg-white/5 backdrop-blur border border-white/10 p-1 rounded-lg">
      {LANGUAGES.map((lang) => {
        const isSelected = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLang(lang.code)}
            aria-selected={isSelected}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              isSelected
                ? 'bg-[#c3943a] text-black shadow-sm font-extrabold'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <img
              src={lang.flag}
              alt={lang.label}
              className="w-4 h-3 object-cover rounded-sm shrink-0 shadow-xs"
            />
            <span className="uppercase tracking-wider">{lang.code}</span>
          </button>
        );
      })}
    </div>
  );
}

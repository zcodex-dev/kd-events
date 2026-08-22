'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import type { Locale } from '@/lib/i18n/translations';

type LanguageSwitcherProps = {
  currentLang: Locale;
  onLanguageChange: (lang: Locale) => void;
  className?: string;
};

const LANGUAGES: { code: Locale; label: string; subLabel: string; flag: string }[] = [
  { code: 'en', label: 'English', subLabel: 'EN', flag: 'https://flagcdn.com/w20/gb.png' },
  { code: 'id', label: 'Bahasa Indonesia', subLabel: 'ID', flag: 'https://flagcdn.com/w20/id.png' },
  { code: 'zh', label: '简体中文', subLabel: 'ZH', flag: 'https://flagcdn.com/w20/cn.png' },
];

export function LanguageSwitcher({
  currentLang,
  onLanguageChange,
  className = '',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative shrink-0 ${className}`}>
      {/* Trigger Button with Globe Icon */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/15 active:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-xs font-bold text-white transition-all cursor-pointer select-none"
        style={{ outline: 'none' }}
      >
        <Globe className="w-3.5 h-3.5 text-[#c3943a]" />
        <img
          src={activeLang.flag}
          alt=""
          className="w-4 h-2.5 object-cover rounded-[2px] shadow-2xs shrink-0"
          loading="lazy"
        />
        <span className="tracking-wide uppercase text-[11px] md:text-xs">{activeLang.subLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#c3943a]' : ''
          }`}
        />
      </button>

      {/* Floating Language Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Select Language
          </div>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#c3943a]/20 text-[#e5ac53] font-bold'
                    : 'text-neutral-200 hover:bg-white/10 hover:text-white'
                }`}
                style={{ outline: 'none' }}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={lang.flag}
                    alt=""
                    className="w-4 h-2.5 object-cover rounded-[2px] shadow-2xs shrink-0"
                    loading="lazy"
                  />
                  <span>{lang.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#c3943a] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

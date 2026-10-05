'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGES } from '@/lib/showcase/language-context';

function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentLang, changeLang } = useLanguage();

  const currentConfig = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-1.5 bg-[#181818]/90 hover:bg-[#222222] border border-white/15 hover:border-white/25 rounded-xl transition-all select-none shadow-sm active:scale-95 cursor-pointer"
      >
        <img
          src={currentConfig.flag}
          alt={currentConfig.label}
          className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0"
        />
        <span className="text-xs sm:text-sm font-medium text-white tracking-wide">
          {currentConfig.label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-40 sm:w-44 bg-[#181818]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-1" role="listbox">
            {LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    changeLang(lang.code);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs sm:text-sm transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#c3943a]/20 text-[#e5ac53] font-semibold border border-[#c3943a]/30'
                      : 'text-neutral-200 hover:bg-white/10 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={lang.flag}
                      alt={lang.label}
                      className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0"
                    />
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c3943a]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-[#101010]/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Official Kompong Dewa Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo-v2.png"
              alt="Kompong Dewa Integrated Resort"
              width={200}
              height={50}
              priority
              className="h-8 sm:h-11 w-auto object-contain transition-transform duration-300 hover:scale-[1.02]"
              unoptimized
            />
          </Link>

          {/* Clean Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium text-white hover:text-[#e5ac53] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/events?tag=Baccarat"
              className="text-sm font-medium text-neutral-300 hover:text-[#e5ac53] transition-colors"
            >
              Tournaments
            </Link>
            <Link
              href="/events"
              className="text-sm font-medium text-neutral-300 hover:text-[#e5ac53] transition-colors"
            >
              All Events
            </Link>
            <Link
              href="/events/baccarat-masters"
              className="text-sm font-medium text-neutral-300 hover:text-[#e5ac53] transition-colors"
            >
              Rules &amp; Structure
            </Link>
          </nav>

          {/* Right Action: Language Switcher (replaced Sign In & Register) */}
          <div className="hidden md:flex items-center">
            <Suspense
              fallback={
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181818]/90 border border-white/15 rounded-xl">
                  <img
                    src="https://flagcdn.com/w40/us.png"
                    alt="English"
                    className="w-5 h-3.5 object-cover rounded-[2px] shadow-sm shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-medium text-white tracking-wide">
                    English
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </div>
              }
            >
              <LanguageSelector />
            </Suspense>
          </div>

          {/* Mobile Menu Toggle & Language Switcher */}
          <div className="flex md:hidden items-center gap-2">
            <Suspense fallback={null}>
              <LanguageSelector />
            </Suspense>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-300 hover:text-white rounded-lg border border-white/10 bg-neutral-900/60 active:scale-95"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#101010]/95 backdrop-blur-xl border-b border-white/10 px-5 pt-3 pb-6 space-y-3 shadow-2xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-white/5 active:bg-white/10"
          >
            Home
          </Link>
          <Link
            href="/events?tag=Baccarat"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-white/5 active:bg-white/10"
          >
            Tournaments
          </Link>
          <Link
            href="/events"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-white/5 active:bg-white/10"
          >
            All Events
          </Link>
          <Link
            href="/events/baccarat-masters"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:bg-white/5 active:bg-white/10"
          >
            Rules &amp; Structure
          </Link>
        </div>
      )}
    </header>
  );
}

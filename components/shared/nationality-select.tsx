'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Globe } from 'lucide-react';
import { NATIONALITIES, type NationalityOption } from '@/lib/constants/nationalities';

type NationalitySelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function NationalitySelect({
  value,
  onChange,
  placeholder = 'Select your nationality',
  required = false,
  className = '',
}: NationalitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    if (!value) return null;
    return NATIONALITIES.find(
      (n) => n.value.toLowerCase() === value.toLowerCase() || n.label.toLowerCase() === value.toLowerCase()
    );
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return NATIONALITIES;
    const q = search.toLowerCase().trim();
    return NATIONALITIES.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.value.toLowerCase().includes(q) ||
        n.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (option: NationalityOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML5 form validation */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-white border ${
          isOpen ? 'border-[#c3943a] ring-2 ring-[#c3943a]/20' : 'border-neutral-200 hover:border-neutral-300'
        } rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-left flex items-center justify-between transition-all outline-none cursor-pointer shadow-2xs`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption ? (
            <>
              <span className="text-lg md:text-xl leading-none select-none">{selectedOption.flag}</span>
              <span className="text-black font-medium truncate">{selectedOption.label}</span>
            </>
          ) : value ? (
            <>
              <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-black font-medium truncate">{value}</span>
            </>
          ) : (
            <span className="text-neutral-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#c3943a]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-neutral-100 bg-neutral-50/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nationality or country..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs md:text-sm text-black placeholder:text-neutral-400 outline-none focus:border-[#c3943a] focus:ring-1 focus:ring-[#c3943a]"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-neutral-50 py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected =
                  value &&
                  (value.toLowerCase() === option.value.toLowerCase() ||
                    value.toLowerCase() === option.label.toLowerCase());

                return (
                  <button
                    key={option.code + option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-3.5 py-2.5 text-xs md:text-sm text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#c3943a]/10 text-[#c3943a] font-bold'
                        : 'text-neutral-800 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base md:text-lg leading-none select-none">{option.flag}</span>
                      <span className="truncate">{option.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#c3943a] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400">
                No nationality matching &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

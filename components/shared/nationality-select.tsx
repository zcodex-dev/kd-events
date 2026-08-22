'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Globe, Edit3, X } from 'lucide-react';
import { NATIONALITIES, getFlagUrl, type NationalityOption } from '@/lib/constants/nationalities';

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
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Focus custom input when switched to custom mode
  useEffect(() => {
    if (isCustomMode) {
      setTimeout(() => {
        customInputRef.current?.focus();
      }, 50);
    }
  }, [isCustomMode]);

  // Detect if current value is in predefined list or custom
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
    if (option.code === 'other') {
      setIsCustomMode(true);
      setCustomValue('');
      setIsOpen(false);
    } else {
      setIsCustomMode(false);
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customValue.trim()) {
      onChange(customValue.trim());
    }
  };

  const handleSwitchToDropdown = () => {
    setIsCustomMode(false);
    setCustomValue('');
    setIsOpen(true);
  };

  // If in custom mode, display manual input field
  if (isCustomMode) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="relative flex items-center">
          <input
            ref={customInputRef}
            type="text"
            value={customValue}
            onChange={(e) => {
              setCustomValue(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="Type your nationality here..."
            className="w-full bg-white border border-[#c3943a] focus:ring-2 focus:ring-[#c3943a]/20 rounded-lg pl-3.5 pr-20 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
            required={required}
          />
          <button
            type="button"
            onClick={handleSwitchToDropdown}
            className="absolute right-2 px-2.5 py-1 text-xs font-semibold text-neutral-500 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          >
            List
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-neutral-400">
          Typing custom nationality. Click &quot;List&quot; to pick from countries.
        </p>
      </div>
    );
  }

  const flagUrl = selectedOption ? getFlagUrl(selectedOption.code) : null;

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
          {flagUrl ? (
            <img
              src={flagUrl}
              alt=""
              className="w-5 h-3.5 object-cover rounded-[2px] shadow-2xs shrink-0 border border-neutral-200/60"
              loading="lazy"
            />
          ) : (
            <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
          )}

          {selectedOption ? (
            <span className="text-black font-medium truncate">{selectedOption.label}</span>
          ) : value ? (
            <span className="text-black font-medium truncate">{value}</span>
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
                placeholder="Search country or nationality..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs md:text-sm text-black placeholder:text-neutral-400 outline-none focus:border-[#c3943a]"
                style={{ outline: 'none', boxShadow: 'none' }}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-50 py-1">
            {filteredOptions.map((option) => {
              const optFlag = getFlagUrl(option.code);
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
                    {optFlag ? (
                      <img
                        src={optFlag}
                        alt=""
                        className="w-5 h-3.5 object-cover rounded-[2px] shadow-2xs shrink-0 border border-neutral-200/60"
                        loading="lazy"
                      />
                    ) : (
                      <Edit3 className="w-4 h-4 text-[#c3943a] shrink-0" />
                    )}
                    <span className="truncate">{option.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#c3943a] shrink-0" />}
                </button>
              );
            })}

            {/* Custom Type Option when searching something custom */}
            {search.trim().length > 0 && !filteredOptions.some(o => o.label.toLowerCase() === search.toLowerCase().trim()) && (
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(true);
                  setCustomValue(search.trim());
                  onChange(search.trim());
                  setIsOpen(false);
                }}
                className="w-full px-3.5 py-3 text-xs md:text-sm text-left flex items-center gap-2 text-[#c3943a] font-bold bg-[#c3943a]/5 hover:bg-[#c3943a]/10 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 shrink-0" />
                <span>Type &quot;{search.trim()}&quot; as nationality</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

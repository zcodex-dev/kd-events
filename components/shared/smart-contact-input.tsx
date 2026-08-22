'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Phone, Mail, AtSign, Check } from 'lucide-react';
import { COUNTRY_DIAL_CODES, getCountryFlagUrl, type CountryDialCode } from '@/lib/constants/country-codes';

type SmartContactInputProps = {
  value: string;
  onChange: (value: string) => void;
  nationality?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function SmartContactInput({
  value,
  onChange,
  nationality,
  placeholder,
  required = false,
  className = '',
}: SmartContactInputProps) {
  // Determine initial mode based on value
  const initialMode = useMemo(() => {
    if (value && (value.includes('@') || /^[a-zA-Z]/.test(value.trim()))) {
      return 'email';
    }
    return 'phone';
  }, [value]);

  const [mode, setMode] = useState<'phone' | 'email'>(initialMode);
  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(() => {
    // Default to Cambodia (+855) or Indonesia (+62)
    return COUNTRY_DIAL_CODES.find((c) => c.code === 'kh') || COUNTRY_DIAL_CODES[0];
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const numberInputRef = useRef<HTMLInputElement>(null);

  // Sync with nationality if passed
  useEffect(() => {
    if (nationality) {
      const match = COUNTRY_DIAL_CODES.find(
        (c) =>
          (c.nationality && c.nationality.toLowerCase() === nationality.toLowerCase()) ||
          c.country.toLowerCase() === nationality.toLowerCase()
      );
      if (match) {
        setSelectedCountry(match);
      }
    }
  }, [nationality]);

  // Sync internal state when external value changes
  useEffect(() => {
    if (!value) {
      setPhoneNumber('');
      setEmailValue('');
      return;
    }

    if (value.includes('@') || /^[a-zA-Z]/.test(value.trim())) {
      setMode('email');
      setEmailValue(value);
    } else {
      setMode('phone');
      // If value starts with a known dial code, extract it
      const matchedDial = COUNTRY_DIAL_CODES.find((c) => value.startsWith(c.dialCode));
      if (matchedDial) {
        setSelectedCountry(matchedDial);
        const rest = value.slice(matchedDial.dialCode.length).trim();
        setPhoneNumber(rest);
      } else {
        setPhoneNumber(value.replace(/^\+/, '').trim());
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isDropdownOpen]);

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_DIAL_CODES;
    const q = search.toLowerCase().trim();
    return COUNTRY_DIAL_CODES.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.includes(q) ||
        (c.nationality && c.nationality.toLowerCase().includes(q))
    );
  }, [search]);

  // Handle phone input changes
  const handlePhoneChange = (raw: string) => {
    // If user types '@', auto switch to email mode!
    if (raw.includes('@')) {
      setMode('email');
      setEmailValue(raw);
      onChange(raw.trim());
      return;
    }

    // Strip characters that aren't digits, spaces, or hyphens
    const cleanDigits = raw.replace(/[^\d\s-]/g, '');
    setPhoneNumber(cleanDigits);

    if (cleanDigits.trim()) {
      // Remove leading zero if entered when dial code is present (e.g. 0812 -> 812)
      const normalizedNum = cleanDigits.trim().replace(/^0+/, '');
      onChange(`${selectedCountry.dialCode} ${normalizedNum}`.trim());
    } else {
      onChange('');
    }
  };

  // Handle email/telegram input changes
  const handleEmailChange = (raw: string) => {
    setEmailValue(raw);
    onChange(raw.trim());
  };

  const handleSelectCountry = (country: CountryDialCode) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    if (phoneNumber.trim()) {
      const normalizedNum = phoneNumber.trim().replace(/^0+/, '');
      onChange(`${country.dialCode} ${normalizedNum}`.trim());
    }
  };

  const switchToPhone = () => {
    setMode('phone');
    if (phoneNumber.trim()) {
      const normalizedNum = phoneNumber.trim().replace(/^0+/, '');
      onChange(`${selectedCountry.dialCode} ${normalizedNum}`.trim());
    } else {
      onChange('');
    }
  };

  const switchToEmail = () => {
    setMode('email');
    onChange(emailValue.trim());
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Top Toggle Switch */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] md:text-xs font-semibold text-neutral-600 dark:text-neutral-300 block">
          {mode === 'phone' ? 'Phone Number' : 'Email or Telegram'} <span className="text-red-500">*</span>
        </label>
        
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={switchToPhone}
            className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              mode === 'phone'
                ? 'bg-white dark:bg-neutral-900 text-[#c3943a] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Phone className="w-3 h-3" />
            Phone
          </button>
          <button
            type="button"
            onClick={switchToEmail}
            className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
              mode === 'email'
                ? 'bg-white dark:bg-neutral-900 text-[#c3943a] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3 h-3" />
            Email / TG
          </button>
        </div>
      </div>

      {/* Input Container */}
      <div className="relative">
        {mode === 'phone' ? (
          <div className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus-within:border-[#c3943a] focus-within:ring-2 focus-within:ring-[#c3943a]/20 transition-all overflow-visible">
            {/* Country Code Picker Button */}
            <div ref={dropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2.5 md:py-3 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-800 text-xs md:text-sm font-bold text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer rounded-l-lg"
              >
                <img
                  src={getCountryFlagUrl(selectedCountry.code)}
                  alt={selectedCountry.country}
                  className="w-5 h-3.5 object-cover rounded-[2px] shadow-2xs shrink-0 border border-neutral-200/60"
                  loading="lazy"
                />
                <span>{selectedCountry.dialCode}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180 text-[#c3943a]' : ''
                  }`}
                />
              </button>

              {/* Country Search Dropdown */}
              {isDropdownOpen && (
                <div className="absolute z-50 left-0 top-full mt-1.5 w-64 md:w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/60">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search country or code..."
                        className="w-full pl-8 pr-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-[#c3943a]"
                      />
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-neutral-50 dark:divide-neutral-800/50 py-1">
                    {filteredCountries.map((c) => {
                      const isSelected = selectedCountry.code === c.code && selectedCountry.dialCode === c.dialCode;
                      return (
                        <button
                          key={`${c.code}-${c.dialCode}`}
                          type="button"
                          onClick={() => handleSelectCountry(c)}
                          className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#c3943a]/10 text-[#c3943a] font-bold'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <img
                              src={getCountryFlagUrl(c.code)}
                              alt=""
                              className="w-4 h-3 object-cover rounded-[2px] shrink-0 border border-neutral-200/50"
                              loading="lazy"
                            />
                            <span className="truncate">{c.country}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="font-mono text-neutral-500 dark:text-neutral-400">{c.dialCode}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#c3943a]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <input
              ref={numberInputRef}
              type="tel"
              value={phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={placeholder || '812 3456 7890'}
              className="flex-1 bg-transparent px-3.5 py-2.5 md:py-3 text-sm md:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
              required={required}
            />
          </div>
        ) : (
          /* Email / Telegram Mode: Country Code is Hidden */
          <div className="relative flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus-within:border-[#c3943a] focus-within:ring-2 focus-within:ring-[#c3943a]/20 transition-all">
            <div className="pl-3.5 pr-1 text-neutral-400">
              <AtSign className="w-4 h-4 text-[#c3943a]" />
            </div>
            <input
              type="text"
              value={emailValue}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={placeholder || 'name@example.com or @telegram_handle'}
              className="w-full bg-transparent px-3 py-2.5 md:py-3 text-sm md:text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 outline-none"
              required={required}
            />
          </div>
        )}
      </div>
    </div>
  );
}

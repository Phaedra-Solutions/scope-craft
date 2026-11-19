'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { Check, CheckCircle2, ChevronDown, Search } from 'lucide-react';
import {
  getPhoneCountryOptions,
  getPhonePlaceholder,
  getPopularPhoneCountries,
  PhoneCountryOption,
  validateAndFormatE164
} from '@/lib/phone-utils';

interface PhoneInputFieldProps {
  country: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  id?: string;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  country,
  onCountryChange,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const allCountries = useMemo(() => getPhoneCountryOptions(), []);
  const popularCountries = useMemo(() => getPopularPhoneCountries(), []);

  const selectedOption = useMemo(
    () => allCountries.find((c) => c.iso === country) || allCountries[0],
    [allCountries, country]
  );

  const placeholder = useMemo(() => getPhonePlaceholder(country), [country]);

  const liveValidation = useMemo(() => {
    if (!value.trim()) return null;
    return validateAndFormatE164(value, country);
  }, [value, country]);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allCountries;
    const normalizedDigits = q.replace(/^\+/, '');
    return allCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dialCode.includes(normalizedDigits) ||
        `+${c.dialCode}`.includes(q)
    );
  }, [allCountries, searchQuery]);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        phoneInputRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when opening dropdown
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => searchInputRef.current?.focus(), 10);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleToggleDropdown = () => {
    setIsOpen((prev) => {
      if (prev) setSearchQuery('');
      return !prev;
    });
  };

  const handleSelectCountry = (option: PhoneCountryOption) => {
    onCountryChange(option.iso);
    setIsOpen(false);
    setSearchQuery('');
    phoneInputRef.current?.focus();
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow only phone digits, +, spaces, hyphens, parentheses, and dots
    const sanitized = raw.replace(/[^\d+\s\-().]/g, '');

    // If user pastes or enters an international +<cc>... number, detect its country automatically
    if (sanitized.trim().startsWith('+')) {
      const parsed = parsePhoneNumberFromString(sanitized.trim());
      if (parsed?.country && parsed.nationalNumber) {
        onCountryChange(parsed.country);
        onChange(parsed.formatNational() || parsed.nationalNumber);
        return;
      }
    }

    onChange(sanitized);
  };

  const showPopularSection = !searchQuery.trim();

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`w-full flex items-center rounded-xl border text-sm text-[#082A1C] bg-[#F4F7F9] focus-within:bg-white transition-all duration-200 ${
          error
            ? 'border-red-600 focus-within:border-red-600'
            : 'border-[#DDE3E7] focus-within:border-[#082A1C]'
        }`}
      >
        {/* Country Code & Flag Dropdown Trigger */}
        <button
          type="button"
          onClick={handleToggleDropdown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Selected country ${selectedOption?.name} (+${selectedOption?.dialCode})`}
          className="flex items-center space-x-1.5 pl-3 pr-2.5 py-2.5 border-r border-[#DDE3E7] text-xs font-semibold text-[#082A1C] hover:bg-[#DDE3E7]/40 rounded-l-xl transition-colors flex-shrink-0 cursor-pointer"
        >
          <span className="text-base leading-none" aria-hidden="true">
            {selectedOption?.flag}
          </span>
          <span className="font-mono font-bold tabular-nums">
            +{selectedOption?.dialCode}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#64707A] transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* National Phone Input */}
        <input
          ref={phoneInputRef}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          value={value}
          onChange={handlePhoneInputChange}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className="w-full min-w-0 px-3 py-2.5 bg-transparent text-sm text-[#082A1C] placeholder:text-[#64707A]/60 focus:outline-none rounded-r-xl"
        />

        {liveValidation?.isValid && !error && (
          <span
            className="pr-3 text-[#144731] flex-shrink-0"
            title={`Valid E.164: ${liveValidation.e164}`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </span>
        )}
      </div>

      {/* E.164 Live Confirmation Helper */}
      {!error && liveValidation?.isValid && liveValidation.e164 && (
        <p className="text-[11px] text-[#144731] font-mono mt-1 tabular-nums">
          Valid E.164: {liveValidation.e164}
        </p>
      )}

      {/* Searchable Country Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select country calling code"
          className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-[#DDE3E7] rounded-xl shadow-xl shadow-[#082A1C]/10 overflow-hidden"
        >
          {/* Search Bar */}
          <div className="p-2 border-b border-[#DDE3E7] bg-[#F4F7F9]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64707A] absolute left-2.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code (+971, UAE, US)..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#DDE3E7] bg-white text-xs text-[#082A1C] placeholder:text-[#64707A]/70 focus:outline-none focus:border-[#082A1C]"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#DDE3E7]/50">
            {showPopularSection && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64707A] bg-[#F4F7F9]/70">
                  Popular Countries
                </div>
                {popularCountries.map((option) => {
                  const isSelected = option.iso === country;
                  return (
                    <button
                      key={`pop-${option.iso}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectCountry(option)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#CDFF8C]/35 text-[#082A1C] font-bold'
                          : 'text-[#082A1C] hover:bg-[#F4F7F9]'
                      }`}
                    >
                      <span className="flex items-center space-x-2 min-w-0">
                        <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
                          {option.flag}
                        </span>
                        <span className="truncate">{option.name}</span>
                        <span className="text-[10px] font-mono text-[#64707A] flex-shrink-0">
                          {option.iso}
                        </span>
                      </span>
                      <span className="flex items-center space-x-1.5 flex-shrink-0">
                        <span className="font-mono font-semibold text-[#082A1C] tabular-nums">
                          +{option.dialCode}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#082A1C]" />}
                      </span>
                    </button>
                  );
                })}
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64707A] bg-[#F4F7F9]/70 border-t border-[#DDE3E7]">
                  All Countries
                </div>
              </div>
            )}

            {filteredCountries.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#64707A]">
                No countries matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredCountries.map((option) => {
                const isSelected = option.iso === country;
                return (
                  <button
                    key={option.iso}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectCountry(option)}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#CDFF8C]/35 text-[#082A1C] font-bold'
                        : 'text-[#082A1C] hover:bg-[#F4F7F9]'
                    }`}
                  >
                    <span className="flex items-center space-x-2 min-w-0">
                      <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
                        {option.flag}
                      </span>
                      <span className="truncate">{option.name}</span>
                      <span className="text-[10px] font-mono text-[#64707A] flex-shrink-0">
                        {option.iso}
                      </span>
                    </span>
                    <span className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className="font-mono font-semibold text-[#082A1C] tabular-nums">
                        +{option.dialCode}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#082A1C]" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import {
  CountryCode,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength
} from 'libphonenumber-js/max';
import mobileExamples from 'libphonenumber-js/examples.mobile.json';

export interface PhoneCountryOption {
  iso: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  isPopular: boolean;
}

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string | null;
  errorMessage: string | null;
  detectedCountry?: CountryCode;
  formattedNational?: string;
}

const POPULAR_ISO_CODES: CountryCode[] = [
  'US',
  'GB',
  'CA',
  'AU',
  'AE',
  'SA',
  'DE',
  'SG',
  'FR',
  'NL',
  'PK',
  'IN'
];

const E164_STRICT_REGEX = /^\+[1-9]\d{6,14}$/;

export function isoToFlag(iso: string): string {
  const upper = iso.toUpperCase();
  if (upper.length !== 2) return '🌐';
  const codePoints = [...upper].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

let cachedCountries: PhoneCountryOption[] | null = null;

export function getPhoneCountryOptions(): PhoneCountryOption[] {
  if (cachedCountries) return cachedCountries;

  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    displayNames = null;
  }

  const popularSet = new Set<CountryCode>(POPULAR_ISO_CODES);

  cachedCountries = getCountries()
    .map((iso) => {
      let name = iso as string;
      try {
        name = displayNames?.of(iso) || iso;
      } catch {
        name = iso;
      }

      return {
        iso,
        name,
        dialCode: getCountryCallingCode(iso),
        flag: isoToFlag(iso),
        isPopular: popularSet.has(iso)
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return cachedCountries;
}

export function getPopularPhoneCountries(): PhoneCountryOption[] {
  const all = getPhoneCountryOptions();
  const byIso = new Map(all.map((c) => [c.iso, c]));
  return POPULAR_ISO_CODES.map((iso) => byIso.get(iso)).filter(
    (c): c is PhoneCountryOption => Boolean(c)
  );
}

export function getPhonePlaceholder(country: CountryCode): string {
  try {
    const example = getExampleNumber(country, mobileExamples);
    if (example) {
      return `e.g. ${example.formatNational()}`;
    }
  } catch {
    // fallback below
  }
  return 'e.g. 555 019 2834';
}

export function getExampleE164(country: CountryCode): string {
  try {
    const example = getExampleNumber(country, mobileExamples);
    if (example) {
      return example.formatInternational();
    }
  } catch {
    // fallback below
  }
  return `+${getCountryCallingCode(country)} 5550192834`;
}

export function validateAndFormatE164(
  rawInput: string,
  selectedCountry: CountryCode
): PhoneValidationResult {
  const trimmed = rawInput.trim();

  if (!trimmed) {
    return {
      isValid: false,
      e164: null,
      errorMessage: 'Phone number is required'
    };
  }

  // Reject letters or unexpected symbols early
  if (/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      e164: null,
      errorMessage: 'Phone number must contain digits only (no letters)'
    };
  }

  // Disallow non-phone punctuation (only digits, +, spaces, hyphens, parentheses, dots allowed)
  if (/[^\d+\s\-().]/.test(trimmed)) {
    return {
      isValid: false,
      e164: null,
      errorMessage: 'Please remove invalid characters from the phone number'
    };
  }

  const startsWithPlus = trimmed.startsWith('+');
  const parsed = startsWithPlus
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, selectedCountry);

  const lengthCheck = startsWithPlus
    ? validatePhoneNumberLength(trimmed)
    : validatePhoneNumberLength(trimmed, selectedCountry);

  const countryLabel =
    getPhoneCountryOptions().find((c) => c.iso === (parsed?.country || selectedCountry))?.name ||
    selectedCountry;

  if (lengthCheck === 'TOO_SHORT') {
    return {
      isValid: false,
      e164: null,
      errorMessage: `Phone number is too short for ${countryLabel}. Example: ${getExampleE164(
        parsed?.country || selectedCountry
      )}`
    };
  }

  if (lengthCheck === 'TOO_LONG') {
    return {
      isValid: false,
      e164: null,
      errorMessage: `Phone number exceeds valid length for ${countryLabel} (max 15 E.164 digits)`
    };
  }

  if (!parsed || !parsed.isValid() || !E164_STRICT_REGEX.test(parsed.number)) {
    return {
      isValid: false,
      e164: null,
      errorMessage: `Enter a valid international E.164 phone number for ${countryLabel} (e.g. ${getExampleE164(
        selectedCountry
      )})`
    };
  }

  return {
    isValid: true,
    e164: parsed.number,
    detectedCountry: parsed.country,
    formattedNational: parsed.formatNational(),
    errorMessage: null
  };
}

export type CountryDialCode = {
  country: string;
  code: string; // ISO 2-letter lowercase for flagcdn.com (Flagpedia)
  dialCode: string; // e.g. "+855"
  nationality?: string;
};

export const COUNTRY_DIAL_CODES: CountryDialCode[] = [
  // Top Asian & Regional
  { country: 'Cambodia', code: 'kh', dialCode: '+855', nationality: 'Cambodian' },
  { country: 'Indonesia', code: 'id', dialCode: '+62', nationality: 'Indonesian' },
  { country: 'China', code: 'cn', dialCode: '+86', nationality: 'Chinese' },
  { country: 'Vietnam', code: 'vn', dialCode: '+84', nationality: 'Vietnamese' },
  { country: 'Thailand', code: 'th', dialCode: '+66', nationality: 'Thai' },
  { country: 'Malaysia', code: 'my', dialCode: '+60', nationality: 'Malaysian' },
  { country: 'Singapore', code: 'sg', dialCode: '+65', nationality: 'Singaporean' },
  { country: 'Philippines', code: 'ph', dialCode: '+63', nationality: 'Filipino' },
  { country: 'Myanmar', code: 'mm', dialCode: '+95', nationality: 'Burmese' },
  { country: 'Laos', code: 'la', dialCode: '+856', nationality: 'Laotian' },
  { country: 'Taiwan', code: 'tw', dialCode: '+886', nationality: 'Taiwanese' },
  { country: 'South Korea', code: 'kr', dialCode: '+82', nationality: 'South Korean' },
  { country: 'Japan', code: 'jp', dialCode: '+81', nationality: 'Japanese' },
  { country: 'India', code: 'in', dialCode: '+91', nationality: 'Indian' },
  { country: 'Hong Kong', code: 'hk', dialCode: '+852' },
  { country: 'Macau', code: 'mo', dialCode: '+853' },

  // Americas
  { country: 'United States', code: 'us', dialCode: '+1', nationality: 'American' },
  { country: 'Canada', code: 'ca', dialCode: '+1', nationality: 'Canadian' },
  { country: 'Brazil', code: 'br', dialCode: '+55', nationality: 'Brazilian' },
  { country: 'Mexico', code: 'mx', dialCode: '+52', nationality: 'Mexican' },
  { country: 'Argentina', code: 'ar', dialCode: '+54', nationality: 'Argentine' },

  // Europe
  { country: 'United Kingdom', code: 'gb', dialCode: '+44', nationality: 'British' },
  { country: 'Germany', code: 'de', dialCode: '+49', nationality: 'German' },
  { country: 'France', code: 'fr', dialCode: '+33', nationality: 'French' },
  { country: 'Italy', code: 'it', dialCode: '+39', nationality: 'Italian' },
  { country: 'Spain', code: 'es', dialCode: '+34', nationality: 'Spanish' },
  { country: 'Netherlands', code: 'nl', dialCode: '+31', nationality: 'Dutch' },
  { country: 'Switzerland', code: 'ch', dialCode: '+41', nationality: 'Swiss' },
  { country: 'Sweden', code: 'se', dialCode: '+46', nationality: 'Swedish' },
  { country: 'Norway', code: 'no', dialCode: '+47', nationality: 'Norwegian' },
  { country: 'Denmark', code: 'dk', dialCode: '+45', nationality: 'Danish' },
  { country: 'Finland', code: 'fi', dialCode: '+358', nationality: 'Finnish' },
  { country: 'Belgium', code: 'be', dialCode: '+32', nationality: 'Belgian' },
  { country: 'Austria', code: 'at', dialCode: '+43', nationality: 'Austrian' },
  { country: 'Poland', code: 'pl', dialCode: '+48', nationality: 'Polish' },
  { country: 'Portugal', code: 'pt', dialCode: '+351', nationality: 'Portuguese' },
  { country: 'Ireland', code: 'ie', dialCode: '+353', nationality: 'Irish' },
  { country: 'Russia', code: 'ru', dialCode: '+7', nationality: 'Russian' },
  { country: 'Turkey', code: 'tr', dialCode: '+90', nationality: 'Turkish' },

  // Oceania & Middle East & Others
  { country: 'Australia', code: 'au', dialCode: '+61', nationality: 'Australian' },
  { country: 'New Zealand', code: 'nz', dialCode: '+64', nationality: 'New Zealander' },
  { country: 'United Arab Emirates', code: 'ae', dialCode: '+971', nationality: 'Emirati' },
  { country: 'Saudi Arabia', code: 'sa', dialCode: '+966', nationality: 'Saudi' },
  { country: 'South Africa', code: 'za', dialCode: '+27', nationality: 'South African' },
  { country: 'Egypt', code: 'eg', dialCode: '+20', nationality: 'Egyptian' },
  { country: 'Pakistan', code: 'pk', dialCode: '+92', nationality: 'Pakistani' },
  { country: 'Bangladesh', code: 'bd', dialCode: '+880', nationality: 'Bangladeshi' },
  { country: 'Sri Lanka', code: 'lk', dialCode: '+94', nationality: 'Sri Lankan' },
  { country: 'Nepal', code: 'np', dialCode: '+977', nationality: 'Nepalese' },
];

export function getCountryFlagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

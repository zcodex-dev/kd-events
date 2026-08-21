export type NationalityOption = {
  label: string;
  value: string;
  code: string; // ISO 2-letter code for flagcdn.com (flagpedia)
};

export const NATIONALITIES: NationalityOption[] = [
  // Top / Regional (SEA & East Asia - Cambodian removed per requirement)
  { label: 'Indonesian', value: 'Indonesian', code: 'id' },
  { label: 'Chinese', value: 'Chinese', code: 'cn' },
  { label: 'Vietnamese', value: 'Vietnamese', code: 'vn' },
  { label: 'Thai', value: 'Thai', code: 'th' },
  { label: 'Malaysian', value: 'Malaysian', code: 'my' },
  { label: 'Singaporean', value: 'Singaporean', code: 'sg' },
  { label: 'Filipino', value: 'Filipino', code: 'ph' },
  { label: 'Burmese (Myanmar)', value: 'Burmese', code: 'mm' },
  { label: 'Laotian', value: 'Laotian', code: 'la' },
  { label: 'Taiwanese', value: 'Taiwanese', code: 'tw' },
  { label: 'South Korean', value: 'South Korean', code: 'kr' },
  { label: 'Japanese', value: 'Japanese', code: 'jp' },
  { label: 'Indian', value: 'Indian', code: 'in' },
  
  // Americas & Europe & Oceania & Global
  { label: 'American', value: 'American', code: 'us' },
  { label: 'British', value: 'British', code: 'gb' },
  { label: 'Australian', value: 'Australian', code: 'au' },
  { label: 'Canadian', value: 'Canadian', code: 'ca' },
  { label: 'Russian', value: 'Russian', code: 'ru' },
  { label: 'French', value: 'French', code: 'fr' },
  { label: 'German', value: 'German', code: 'de' },
  { label: 'Italian', value: 'Italian', code: 'it' },
  { label: 'Spanish', value: 'Spanish', code: 'es' },
  { label: 'Dutch (Netherlands)', value: 'Dutch', code: 'nl' },
  { label: 'Swiss', value: 'Swiss', code: 'ch' },
  { label: 'Swedish', value: 'Swedish', code: 'se' },
  { label: 'Norwegian', value: 'Norwegian', code: 'no' },
  { label: 'Danish', value: 'Danish', code: 'dk' },
  { label: 'Finnish', value: 'Finnish', code: 'fi' },
  { label: 'Belgian', value: 'Belgian', code: 'be' },
  { label: 'Austrian', value: 'Austrian', code: 'at' },
  { label: 'Polish', value: 'Polish', code: 'pl' },
  { label: 'Portuguese', value: 'Portuguese', code: 'pt' },
  { label: 'Irish', value: 'Irish', code: 'ie' },
  { label: 'New Zealander', value: 'New Zealander', code: 'nz' },
  { label: 'Brazilian', value: 'Brazilian', code: 'br' },
  { label: 'Argentine', value: 'Argentine', code: 'ar' },
  { label: 'Mexican', value: 'Mexican', code: 'mx' },
  { label: 'South African', value: 'South African', code: 'za' },
  { label: 'Turkish', value: 'Turkish', code: 'tr' },
  { label: 'Emirati (UAE)', value: 'Emirati', code: 'ae' },
  { label: 'Saudi', value: 'Saudi', code: 'sa' },
  { label: 'Egyptian', value: 'Egyptian', code: 'eg' },
  { label: 'Pakistani', value: 'Pakistani', code: 'pk' },
  { label: 'Bangladeshi', value: 'Bangladeshi', code: 'bd' },
  { label: 'Sri Lankan', value: 'Sri Lankan', code: 'lk' },
  { label: 'Nepalese', value: 'Nepalese', code: 'np' },
  { label: 'Other Nationality (Type manually)', value: 'Other', code: 'other' },
];

export function getFlagUrl(code: string): string | null {
  if (!code || code === 'other' || code === 'xx') return null;
  return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
}

export type NationalityOption = {
  label: string;
  value: string;
  flag: string;
  code: string;
};

export const NATIONALITIES: NationalityOption[] = [
  // Top / Regional (SEA & East Asia)
  { label: 'Cambodian', value: 'Cambodian', flag: '🇰🇭', code: 'KH' },
  { label: 'Indonesian', value: 'Indonesian', flag: '🇮🇩', code: 'ID' },
  { label: 'Chinese', value: 'Chinese', flag: '🇨🇳', code: 'CN' },
  { label: 'Vietnamese', value: 'Vietnamese', flag: '🇻🇳', code: 'VN' },
  { label: 'Thai', value: 'Thai', flag: '🇹🇭', code: 'TH' },
  { label: 'Malaysian', value: 'Malaysian', flag: '🇲🇾', code: 'MY' },
  { label: 'Singaporean', value: 'Singaporean', flag: '🇸🇬', code: 'SG' },
  { label: 'Filipino', value: 'Filipino', flag: '🇵🇭', code: 'PH' },
  { label: 'Burmese (Myanmar)', value: 'Burmese', flag: '🇲🇲', code: 'MM' },
  { label: 'Laotian', value: 'Laotian', flag: '🇱🇦', code: 'LA' },
  { label: 'Taiwanese', value: 'Taiwanese', flag: '🇹🇼', code: 'TW' },
  { label: 'South Korean', value: 'South Korean', flag: '🇰🇷', code: 'KR' },
  { label: 'Japanese', value: 'Japanese', flag: '🇯🇵', code: 'JP' },
  { label: 'Indian', value: 'Indian', flag: '🇮🇳', code: 'IN' },
  
  // Americas & Europe & Oceania & Global
  { label: 'American', value: 'American', flag: '🇺🇸', code: 'US' },
  { label: 'British', value: 'British', flag: '🇬🇧', code: 'GB' },
  { label: 'Australian', value: 'Australian', flag: '🇦🇺', code: 'AU' },
  { label: 'Canadian', value: 'Canadian', flag: '🇨🇦', code: 'CA' },
  { label: 'Russian', value: 'Russian', flag: '🇷🇺', code: 'RU' },
  { label: 'French', value: 'French', flag: '🇫🇷', code: 'FR' },
  { label: 'German', value: 'German', flag: '🇩🇪', code: 'DE' },
  { label: 'Italian', value: 'Italian', flag: '🇮🇹', code: 'IT' },
  { label: 'Spanish', value: 'Spanish', flag: '🇪🇸', code: 'ES' },
  { label: 'Dutch (Netherlands)', value: 'Dutch', flag: '🇳🇱', code: 'NL' },
  { label: 'Swiss', value: 'Swiss', flag: '🇨🇭', code: 'CH' },
  { label: 'Swedish', value: 'Swedish', flag: '🇸🇪', code: 'SE' },
  { label: 'Norwegian', value: 'Norwegian', flag: '🇳🇴', code: 'NO' },
  { label: 'Danish', value: 'Danish', flag: '🇩🇰', code: 'DK' },
  { label: 'Finnish', value: 'Finnish', flag: '🇫🇮', code: 'FI' },
  { label: 'Belgian', value: 'Belgian', flag: '🇧🇪', code: 'BE' },
  { label: 'Austrian', value: 'Austrian', flag: '🇦🇹', code: 'AT' },
  { label: 'Polish', value: 'Polish', flag: '🇵🇱', code: 'PL' },
  { label: 'Portuguese', value: 'Portuguese', flag: '🇵🇹', code: 'PT' },
  { label: 'Irish', value: 'Irish', flag: '🇮🇪', code: 'IE' },
  { label: 'New Zealander', value: 'New Zealander', flag: '🇳🇿', code: 'NZ' },
  { label: 'Brazilian', value: 'Brazilian', flag: '🇧🇷', code: 'BR' },
  { label: 'Argentine', value: 'Argentine', flag: '🇦🇷', code: 'AR' },
  { label: 'Mexican', value: 'Mexican', flag: '🇲🇽', code: 'MX' },
  { label: 'South African', value: 'South African', flag: '🇿🇦', code: 'ZA' },
  { label: 'Turkish', value: 'Turkish', flag: '🇹🇷', code: 'TR' },
  { label: 'Emirati (UAE)', value: 'Emirati', flag: '🇦🇪', code: 'AE' },
  { label: 'Saudi', value: 'Saudi', flag: '🇸🇦', code: 'SA' },
  { label: 'Egyptian', value: 'Egyptian', flag: '🇪🇬', code: 'EG' },
  { label: 'Pakistani', value: 'Pakistani', flag: '🇵🇰', code: 'PK' },
  { label: 'Bangladeshi', value: 'Bangladeshi', flag: '🇧🇩', code: 'BD' },
  { label: 'Sri Lankan', value: 'Sri Lankan', flag: '🇱🇰', code: 'LK' },
  { label: 'Nepalese', value: 'Nepalese', flag: '🇳🇵', code: 'NP' },
  { label: 'Other Nationality', value: 'Other', flag: '🌐', code: 'XX' },
];

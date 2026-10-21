export interface StaffMember {
  personnelId: string;
  normalizedId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  position: string;
  department: string;
  company: string;
  avatarUrl: string;
  badgeUrl: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  whatsappNumber: string;
  whatsappMessage?: string;
  telegramUsername: string;
  instagramUsername: string;
  xUsername: string;
  linkedinUrl?: string;
  wechatId?: string;
  website: string;
  bio: string;
  location: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  joinedYear: string;
  socials: Array<{
    platform: string;
    label: string;
    handle: string;
    url: string;
    iconCdn: string;
    brandColor: string;
  }>;
}

export const STAFF_DIRECTORY: Record<string, StaffMember> = {
  'MK-C052': {
    personnelId: 'MK C052',
    normalizedId: 'MK-C052',
    firstName: 'Jetz',
    lastName: 'Fernandez',
    fullName: 'Jetz Fernandez',
    position: 'Events & Promotions Manager',
    department: 'Corporate Marketing',
    company: 'Kompong Dewa Resort - Sihanoukville',
    avatarUrl: '/staff/MK-C052-badge.png',
    badgeUrl: '/staff/MK-C052-badge.png',
    phone: '+855973593235',
    phoneDisplay: '+855 97 359 3235',
    email: 'jetz.fernandez@kompongdewa.com',
    whatsappNumber: '855973593235',
    whatsappMessage: 'Hello Jetz, I scanned your Kompong Dewa management badge and would like to connect.',
    telegramUsername: 'jetzf',
    instagramUsername: 'jetz.fernandez',
    xUsername: 'jetzf',
    linkedinUrl: 'https://linkedin.com/in/jetz-fernandez',
    wechatId: 'jetz_fernandez',
    website: 'https://kompongdewa.com',
    bio: 'Overseeing luxury resort event experiences, international tournament structures, and high-roller VIP promotions at Kompong Dewa Resort.',
    location: 'Kompong Dewa Resort, Sihanoukville, Cambodia',
    isVerified: true,
    status: 'ACTIVE',
    joinedYear: '2024',
    socials: [
      {
        platform: 'WhatsApp',
        label: 'WhatsApp Chat',
        handle: '+855 97 359 3235',
        url: 'https://wa.me/855973593235?text=Hello%20Jetz%2C%20I%20scanned%20your%20Kompong%20Dewa%20management%20badge',
        iconCdn: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg',
        brandColor: '#25D366',
      },
      {
        platform: 'Telegram',
        label: 'Telegram VIP',
        handle: '@jetzf',
        url: 'https://t.me/jetzf',
        iconCdn: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/telegram.svg',
        brandColor: '#26A5E4',
      },
      {
        platform: 'Instagram',
        label: 'Instagram',
        handle: '@jetz.fernandez',
        url: 'https://instagram.com/jetz.fernandez',
        iconCdn: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg',
        brandColor: '#E4405F',
      },
      {
        platform: 'X.com',
        label: 'X.com (Twitter)',
        handle: '@jetzf',
        url: 'https://x.com/jetzf',
        iconCdn: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg',
        brandColor: '#FFFFFF',
      },
      {
        platform: 'Email',
        label: 'Corporate Email',
        handle: 'jetz.fernandez@kompongdewa.com',
        url: 'mailto:jetz.fernandez@kompongdewa.com',
        iconCdn: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gmail.svg',
        brandColor: '#EA4335',
      },
      {
        platform: 'Phone',
        label: 'Direct Phone Line',
        handle: '+855 97 359 3235',
        url: 'tel:+855973593235',
        iconCdn: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/aircall.svg',
        brandColor: '#34D399',
      },
      {
        platform: 'LinkedIn',
        label: 'LinkedIn Profile',
        handle: 'Jetz Fernandez',
        url: 'https://linkedin.com/in/jetz-fernandez',
        iconCdn: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg',
        brandColor: '#0A66C2',
      },
      {
        platform: 'Resort',
        label: 'Resort Website & Events',
        handle: 'kompongdewa.com',
        url: 'https://kompongdewa.com',
        iconCdn: 'https://kompongdewa.win/kd-logo.png',
        brandColor: '#c59b27',
      },
    ],
  },
};

export function normalizePersonnelId(id: string): string {
  if (!id) return '';
  return id.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9-]/g, '');
}

export function getStaffMember(id: string): StaffMember | null {
  const norm = normalizePersonnelId(id);
  
  if (STAFF_DIRECTORY[norm]) {
    return STAFF_DIRECTORY[norm];
  }

  // Also check without dash (e.g. MKC052 -> MK-C052)
  for (const key of Object.keys(STAFF_DIRECTORY)) {
    if (key.replace(/-/g, '') === norm.replace(/-/g, '')) {
      return STAFF_DIRECTORY[key];
    }
  }

  // Fallback for default staff demo if matching MK pattern
  if (norm.startsWith('MK-') || norm.startsWith('MK')) {
    return {
      ...STAFF_DIRECTORY['MK-C052'],
      personnelId: norm.replace('-', ' '),
      normalizedId: norm,
    };
  }

  return null;
}

export function generateVCard(staff: StaffMember): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${staff.lastName};${staff.firstName};;;`,
    `FN:${staff.fullName}`,
    `ORG:${staff.company};${staff.department}`,
    `TITLE:${staff.position}`,
    `TEL;TYPE=CELL,VOICE:${staff.phone}`,
    `EMAIL;TYPE=WORK,INTERNET:${staff.email}`,
    `URL;TYPE=WORK:${staff.website}`,
    `URL;TYPE=Digital_ID:https://kompongdewa.win/staff/${staff.normalizedId}`,
    `ADR;TYPE=WORK:;;Kompong Dewa Resort;Sihanoukville;;;Cambodia`,
    `NOTE:Official Kompong Dewa Resort Personnel ID: ${staff.personnelId}`,
    'REV:' + new Date().toISOString(),
    'END:VCARD',
  ].join('\r\n');
}

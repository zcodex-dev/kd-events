/**
 * Anti-spam and Real-Data Validation for Event Registration & Membership Enrollment
 */

// Obvious spam and test words (case-insensitive)
const BANNED_WORDS = new Set([
  'test',
  'testing',
  'tes',
  'tester',
  'trial',
  'asdf',
  'asdfg',
  'asdfgh',
  'asdafas',
  'asdasd',
  'asdasdasd',
  'dasdasasda',
  'qwerty',
  'qwer',
  'zxcv',
  'zxcvbn',
  '1234',
  '12345',
  '123456',
  'aaa',
  'aaaa',
  'aaaaa',
  'xxx',
  'xxxx',
  'dummy',
  'temp',
  'admin',
  'user',
  'nobody',
  'none',
  'null',
  'undefined',
  'n/a',
  'na',
  'sample',
  'fake',
  'fake name',
  'random',
  'abc',
  'abcd',
  'xyz',
  'demo',
  'coba',
  'cobaan',
  'percobaan',
]);

/**
 * Checks if a string is typical keyboard mash (e.g., asdf, asdafas, dasdasasda, etc.)
 */
function isKeyboardMash(text: string): boolean {
  const clean = text.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length < 3) return false;

  // 1. Same character repeated 3 or more times (e.g., 'aaa', 'zzzzz', '1111')
  if (/(.)\1{2,}/.test(clean)) return true;

  // 2. Only home row keys mash (a, s, d, f, g, h, j, k, l) with 4+ letters
  const homeRowKeys = new Set(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l']);
  const isOnlyHomeRow = clean.split('').every((c) => homeRowKeys.has(c));
  if (isOnlyHomeRow && clean.length >= 4 && !['flash', 'half', 'glad', 'fall', 'glass'].includes(clean)) {
    // If it contains only a/s/d combinations like 'asdafas', 'dasdasasda', 'asdfgh'
    const asdKeys = new Set(['a', 's', 'd', 'f']);
    const isAsdMash = clean.split('').every((c) => asdKeys.has(c));
    if (isAsdMash) return true;
    if (clean.includes('asdf') || clean.includes('fdsa') || clean.includes('ghjk')) return true;
  }

  // 3. Latin word with 4+ letters that has zero vowels (a, e, i, o, u, y)
  if (clean.length >= 4 && !/[aeiouy]/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Validates that the name looks like a real person's name.
 */
export function validateRealName(name: string | null | undefined): { isValid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Full name is required.' };
  }

  const trimmed = name.trim();

  // Length check
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long.' };
  }
  if (trimmed.length > 70) {
    return { isValid: false, error: 'Name cannot exceed 70 characters.' };
  }

  // Reject purely numbers or symbols
  // Uses Unicode \p{L} (Letter) to properly support English, Indonesian, Chinese, Khmer, etc.
  if (!/\p{L}/u.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid full name.' };
  }

  // Check against banned test words
  const lower = trimmed.toLowerCase();
  if (BANNED_WORDS.has(lower)) {
    return { isValid: false, error: 'Please enter a real full name (test names are not allowed).' };
  }

  // Check for multi-word test names (e.g., 'test user', 'asdf test')
  const words = lower.split(/\s+/);
  if (words.some((w) => BANNED_WORDS.has(w) && w.length >= 3)) {
    return { isValid: false, error: 'Please enter a real full name.' };
  }

  // Check for keyboard mash in words
  for (const w of words) {
    if (isKeyboardMash(w)) {
      return { isValid: false, error: 'Please enter a real full name (random text is not allowed).' };
    }
  }

  return { isValid: true };
}

/**
 * Validates that contact info is either a real phone number, valid email, or valid Telegram handle.
 */
export function validateRealContact(contact: string | null | undefined): { isValid: boolean; error?: string } {
  if (!contact || typeof contact !== 'string') {
    return { isValid: false, error: 'Contact information (Phone, Email, or Telegram) is required.' };
  }

  const trimmed = contact.trim();
  const lower = trimmed.toLowerCase();

  // Reject banned test words
  if (BANNED_WORDS.has(lower)) {
    return { isValid: false, error: 'Please enter a valid Phone Number, Email Address, or Telegram.' };
  }

  // Reject keyboard mash
  if (isKeyboardMash(trimmed)) {
    return { isValid: false, error: 'Please enter a valid Phone Number, Email, or Telegram (random text is not allowed).' };
  }

  // 1. Check if it's an Email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (emailRegex.test(trimmed)) {
    // Check dummy domains
    const domain = trimmed.split('@')[1]?.toLowerCase();
    if (['example.com', 'test.com', 'asdf.com', 'temp.com', 'sample.com'].includes(domain)) {
      return { isValid: false, error: 'Please provide a real email address.' };
    }
    return { isValid: true };
  }

  // 2. Check if it's a Phone Number
  // Allow characters: digits, spaces, hyphens, parentheses, leading plus
  const digitsOnly = trimmed.replace(/\D/g, '');
  const isPhoneFormat = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/.test(trimmed);

  if (isPhoneFormat && digitsOnly.length >= 8 && digitsOnly.length <= 15) {
    // Check dummy phone numbers like 12345678, 11111111, 00000000
    if (/^(.)\1+$/.test(digitsOnly)) {
      return { isValid: false, error: 'Please enter a real phone number.' };
    }
    if (['12345678', '123456789', '1234567890', '0123456789', '9876543210'].includes(digitsOnly)) {
      return { isValid: false, error: 'Please enter a real phone number.' };
    }
    return { isValid: true };
  }

  // 3. Check if it's a Telegram Handle or Link
  const isTelegramHandle = /^@[a-zA-Z0-9_]{4,32}$/.test(trimmed);
  const isTelegramLink = /^https?:\/\/t\.me\/[a-zA-Z0-9_]{4,32}$/i.test(trimmed);
  if (isTelegramHandle || isTelegramLink) {
    const handle = trimmed.replace('@', '').replace(/https?:\/\/t\.me\//i, '').toLowerCase();
    if (BANNED_WORDS.has(handle)) {
      return { isValid: false, error: 'Please enter a real Telegram handle.' };
    }
    return { isValid: true };
  }

  // If it matched none of the valid channels
  return {
    isValid: false,
    error: 'Please provide a valid Phone Number (e.g. +855... or 081...), Email (e.g. user@gmail.com), or Telegram (@username).',
  };
}

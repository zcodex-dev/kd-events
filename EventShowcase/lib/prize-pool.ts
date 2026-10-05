export type PrizeItem = {
  rank: string;
  amount: string;
  placeNumber: number;
};

export type PrizePoolData = {
  sectionTitle?: string;
  totalGuaranteed?: string;
  prizes: PrizeItem[];
  note?: string;
};

export function parsePrizePool(html: string): { prizeData: PrizePoolData | null; remainingHtml: string } {
  if (!html) return { prizeData: null, remainingHtml: html };

  const cleanHtml = html.replace(/&nbsp;/gi, ' ');

  // Multi-language prize indicators: EN, ID (Bahasa), ZH (Chinese)
  const hasPrizeIndicator = /(TOTAL\s+GUARANTEED\s+PRIZE|TOTAL\s+HADIAH|保证奖金|CHAMPION|JUARA\s*\d+|第\s*\d+\s*名|\d+\s*(?:st|nd|rd|th)?\s*Prize)/i.test(cleanHtml);
  if (!hasPrizeIndicator) {
    return { prizeData: null, remainingHtml: html };
  }

  // 1. Section Title (e.g. "Prize Structure", "Struktur Hadiah", "赛事结构 / 奖金结构")
  let sectionTitle: string | undefined;
  const titleMatch = cleanHtml.match(/(Prize\s+Structure|Tournament\s+Structure|Struktur\s+Hadiah|赛事结构\s*\/\s*奖金结构|奖金结构|赛事结构)/i);
  if (titleMatch) {
    sectionTitle = titleMatch[1].replace(/\s+/g, ' ').trim();
  }

  // 2. Full exact internal text for total guaranteed prize
  let totalGuaranteed: string | undefined;
  const fullGuaranteedMatch = cleanHtml.match(/((?:TOTAL\s+)?GUARANTEED\s+(?:PRIZE|TO\s+WIN\s+BIG)[^<\n\r]*|TOTAL\s+HADIAH\s+SEBESAR[^<\n\r]*|保证奖金总额为[^<\n\r]*)/i);
  if (fullGuaranteedMatch) {
    totalGuaranteed = fullGuaranteedMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  } else {
    const guaranteedMatch = cleanHtml.match(/TOTAL\s+GUARANTEED\s+PRIZE\s*(?:OF)?\s*([A-Z0-9\$,\.\s]+?)(?:<\/|<br|\n|$)/i);
    if (guaranteedMatch) {
      totalGuaranteed = `TOTAL GUARANTEED PRIZE OF ${guaranteedMatch[1].replace(/<[^>]*>/g, '').trim()}`;
    }
  }

  // 3. Prizes list — strictly scoped to the Prize Structure section to never bleed into schedule tables
  const prizeSectionRegex =
    /(?:Prize\s+Structure|Struktur\s+Hadiah|赛事结构\s*\/\s*奖金结构|奖金结构|TOTAL\s+GUARANTEED)[\s\S]*?(?=(?:Tournament\s+Structure|Struktur\s+Turnamen|赛事结构|Betting\s+Limits|Rules|Terms|Syarat|<table)|$)/i;
  const sectionMatch = html.match(prizeSectionRegex);
  const targetHtml = sectionMatch ? sectionMatch[0] : html;

  const prizes: PrizeItem[] = [];
  // Strict regex: MUST have CHAMPION/WINNER, Juara, 第X名, ordinal suffix (1st, 2nd, 3rd, 4th...), or the word Prize/Place
  // Bare numbers like '6' or '8' without ordinal or 'Prize' will NEVER match.
  // Negative lookahead (?!\s*(?:AM|PM|am|pm))\b ensures time like '6:00 PM' is strictly excluded.
  const prizeRegex =
    /(CHAMPION|WINNER|RUNNER[\s-]*UP|JUARA\s*\d+|第\s*\d+\s*名(?:奖金)?|\d+\s*(?:st|nd|rd|th)\s*(?:Prize|Place)?|\d+\s*(?:Prize|Place))\s*[:：\-–]\s*((?:USD|\$)?\s*[0-9,]+(?:\.[0-9]{2})?(?!\s*(?:AM|PM|am|pm))\b)/i;

  const blocks = targetHtml.split(/<\/li>|<\/tr>|<\/p>|<br\s*\/?>/gi);

  for (const block of blocks) {
    const text = block
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(\d+)\s+(st|nd|rd|th)\b/gi, (m, d, s) => d + s)
      .trim();
    if (!text) continue;

    const match = text.match(prizeRegex);
    if (match) {
      const rawRank = match[1].replace(/\s+/g, ' ').trim();
      let rawAmount = match[2].replace(/\s+/g, '').trim();
      if (!rawAmount.startsWith('$') && !rawAmount.toUpperCase().startsWith('USD') && /^\d/.test(rawAmount)) {
        rawAmount = `$${rawAmount}`;
      }

      let placeNumber = 99;
      if (/CHAMPION|WINNER|JUARA\s*1|第\s*1\s*名|1st/i.test(rawRank)) placeNumber = 1;
      else if (/2nd|RUNNER[\s-]*UP|JUARA\s*2|第\s*2\s*名/i.test(rawRank)) placeNumber = 2;
      else if (/3rd|JUARA\s*3|第\s*3\s*名/i.test(rawRank)) placeNumber = 3;
      else {
        const numMatch = rawRank.match(/\d+/);
        if (numMatch) placeNumber = parseInt(numMatch[0], 10);
      }

      prizes.push({
        rank: rawRank, // Cleaned rank: "CHAMPION", "2nd Prize", "5th Prize", etc.
        amount: rawAmount,
        placeNumber,
      });
    }
  }

  if (prizes.length === 0) {
    return { prizeData: null, remainingHtml: html };
  }

  // 4. Note in EN, ID, ZH
  let note: string | undefined;
  const noteMatch = cleanHtml.match(/(Full payout ladder[\s\S]*?(?:<\/p>|<br|$)|Guaranteed prizes are just the beginning[\s\S]*?(?:<\/p>|<br|$)|Rincian pembayaran hadiah[\s\S]*?(?:<\/p>|<br|$)|完整奖金分配表[\s\S]*?(?:<\/p>|<br|$))/i);
  if (noteMatch) {
    note = noteMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Remove the extracted prize block from remaining html
  let remainingHtml = html
    // English patterns
    .replace(/<p[^>]*>[\s\S]*?(?:Prize|Tournament)\s+Structure[\s\S]*?<\/p>\s*(?=<p[^>]*>[\s\S]*?TOTAL\s+GUARANTEED)/gi, '')
    .replace(/<p[^>]*>[\s\S]*?TOTAL\s+GUARANTEED[\s\S]*?<\/p>/gi, '')
    .replace(/<ul[^>]*>[\s\S]*?CHAMPION[\s\S]*?<\/ul>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?(?:CHAMPION|2nd\s*Prize|3rd\s*Prize|\d+th\s*Prize)[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?Full\s+payout\s+ladder[\s\S]*?<\/p>/gi, '')
    .replace(/Full\s+payout\s+ladder[\s\S]*?rewards\.?/gi, '')
    // Indonesian patterns
    .replace(/<p[^>]*>[\s\S]*?Struktur\s+Hadiah[\s\S]*?<\/p>\s*(?=<p[^>]*>[\s\S]*?TOTAL\s+HADIAH)/gi, '')
    .replace(/<p[^>]*>[\s\S]*?TOTAL\s+HADIAH[\s\S]*?<\/p>/gi, '')
    .replace(/<ul[^>]*>[\s\S]*?Juara\s*1[\s\S]*?<\/ul>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?Juara\s*\d+[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?Rincian\s+pembayaran\s+hadiah[\s\S]*?<\/p>/gi, '')
    .replace(/Rincian\s+pembayaran\s+hadiah[\s\S]*?total\s+hadiah\.?/gi, '')
    // Chinese patterns
    .replace(/<p[^>]*>[\s\S]*?赛事结构\s*\/\s*奖金结构[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?保证奖金总额[\s\S]*?<\/p>/gi, '')
    .replace(/<ul[^>]*>[\s\S]*?第1名奖金[\s\S]*?<\/ul>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?第\s*\d+\s*名[\s\S]*?<\/p>/gi, '')
    .replace(/<p[^>]*>[\s\S]*?完整奖金分配表[\s\S]*?<\/p>/gi, '')
    .replace(/完整奖金分配表[\s\S]*?越丰厚[。.]?/gi, '');

  return {
    prizeData: {
      sectionTitle,
      totalGuaranteed,
      prizes: prizes.sort((a, b) => a.placeNumber - b.placeNumber),
      note,
    },
    remainingHtml,
  };
}

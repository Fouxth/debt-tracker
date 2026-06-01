/**
 * A utility to transliterate Thai characters/words into basic English karaoke phonetic spelling
 * and format it as a URL-safe/system-safe slug.
 */

const THAI_KARAOKE_MAP: Record<string, string> = {
  'เงิน': 'ngern',
  'ทอง': 'thong',
  'ด่วน': 'duan',
  'กู้': 'ku',
  'ทุน': 'thun',
  'เฮีย': 'heia',
  'เจ๊': 'jae',
  'พี่': 'pee',
  'น้อง': 'nong',
  'ร้าน': 'ran',
  'ดี': 'dee',
  'รวย': 'ruay',
  'ทรัพย์': 'sap',
  'ทวี': 'thawee',
  'เพิ่ม': 'pherm',
  'พูน': 'phoon',
  'มงคล': 'mongkol',
  'เจริญ': 'charoen',
  'สมชาย': 'somchai',
  'สมศักดิ์': 'somsak',
  'สมศรี': 'somsri',
  'วิชัย': 'wichai',
  'สมบัติ': 'sombat',
};

const CONSONANTS: Record<string, string> = {
  'ก': 'k', 'ข': 'kh', 'ฃ': 'kh', 'ค': 'kh', 'ฅ': 'kh', 'ฆ': 'kh',
  'ง': 'ng',
  'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch',
  'ญ': 'y',
  'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th', 'ณ': 'n',
  'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th', 'น': 'n',
  'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph', 'ม': 'm',
  'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
  'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l', 'อ': 'o', 'ฮ': 'h'
};

const VOWELS: Record<string, string> = {
  'ะ': 'a', 'า': 'a', 'ิ': 'i', 'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
  'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai', 'ำ': 'am', 'ั': 'a', '็': '',
  'ิ์': '', '์': '', '่': '', '้': '', '๊': '', '๋': '', 'ุ์': ''
};

export function transliterateThai(text: string): string {
  if (!text) return '';

  let result = text.trim();

  // 1. First replace known full Thai words using our high-priority dictionary
  for (const [thaiWord, engSpelling] of Object.entries(THAI_KARAOKE_MAP)) {
    const regex = new RegExp(thaiWord, 'g');
    result = result.replace(regex, ` ${engSpelling} `);
  }

  // 2. Fallback char-by-char transliteration for any remaining Thai letters
  let charResult = '';
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    if (CONSONANTS[char] !== undefined) {
      charResult += CONSONANTS[char];
    } else if (VOWELS[char] !== undefined) {
      charResult += VOWELS[char];
    } else {
      charResult += char; // Keep English, spaces, hyphens, numbers
    }
  }

  // 3. Clean up the slug: lowercase, replace spaces/special chars with hyphens
  return charResult
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove any weird characters
    .trim()
    .replace(/\s+/g, '-')         // replace spaces with single hyphen
    .replace(/-+/g, '-');         // remove duplicate hyphens
}

// Convert numbered pinyin syllables (e.g. "lao3", "nv3", "ma5") into
// tone-marked pinyin ("lǎo") and Zhuyin / Bopomofo ("ㄌㄠˇ").
// Tone 5 = neutral tone (輕聲).

const INITIALS = {
  b: 'ㄅ', p: 'ㄆ', m: 'ㄇ', f: 'ㄈ',
  d: 'ㄉ', t: 'ㄊ', n: 'ㄋ', l: 'ㄌ',
  g: 'ㄍ', k: 'ㄎ', h: 'ㄏ',
  j: 'ㄐ', q: 'ㄑ', x: 'ㄒ',
  zh: 'ㄓ', ch: 'ㄔ', sh: 'ㄕ', r: 'ㄖ',
  z: 'ㄗ', c: 'ㄘ', s: 'ㄙ',
};

// Finals as written after a consonant initial. "v" stands for ü.
const FINALS = {
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', ong: 'ㄨㄥ', er: 'ㄦ',
  i: 'ㄧ', ia: 'ㄧㄚ', ie: 'ㄧㄝ', iao: 'ㄧㄠ', iu: 'ㄧㄡ', ian: 'ㄧㄢ',
  in: 'ㄧㄣ', iang: 'ㄧㄤ', ing: 'ㄧㄥ', iong: 'ㄩㄥ',
  u: 'ㄨ', ua: 'ㄨㄚ', uo: 'ㄨㄛ', uai: 'ㄨㄞ', ui: 'ㄨㄟ', uan: 'ㄨㄢ',
  un: 'ㄨㄣ', uang: 'ㄨㄤ',
  v: 'ㄩ', ve: 'ㄩㄝ', van: 'ㄩㄢ', vn: 'ㄩㄣ',
};

// Syllables with no consonant initial.
const ZERO_INITIAL = {
  a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
  an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ', er: 'ㄦ',
  yi: 'ㄧ', ya: 'ㄧㄚ', ye: 'ㄧㄝ', yao: 'ㄧㄠ', you: 'ㄧㄡ', yan: 'ㄧㄢ',
  yin: 'ㄧㄣ', yang: 'ㄧㄤ', ying: 'ㄧㄥ', yong: 'ㄩㄥ',
  wu: 'ㄨ', wa: 'ㄨㄚ', wo: 'ㄨㄛ', wai: 'ㄨㄞ', wei: 'ㄨㄟ', wan: 'ㄨㄢ',
  wen: 'ㄨㄣ', wang: 'ㄨㄤ', weng: 'ㄨㄥ',
  yu: 'ㄩ', yue: 'ㄩㄝ', yuan: 'ㄩㄢ', yun: 'ㄩㄣ',
};

// zhi chi shi ri zi ci si: the "i" is an empty rhyme, Zhuyin writes only the initial.
const EMPTY_RHYME_INITIALS = new Set(['zh', 'ch', 'sh', 'r', 'z', 'c', 's']);

const ZHUYIN_TONE = { 1: '', 2: 'ˊ', 3: 'ˇ', 4: 'ˋ', 5: '' };

const TONE_MARKS = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

/** Split "lao3" into { base: "lao", tone: 3 }. */
export function parseSyllable(syllable) {
  const m = /^([a-zü]+)([1-5])$/.exec(syllable.trim().toLowerCase().replace(/u:/g, 'v'));
  if (!m) throw new Error(`Bad pinyin syllable: "${syllable}" (expected letters + tone 1-5)`);
  return { base: m[1].replace(/ü/g, 'v'), tone: Number(m[2]) };
}

function splitInitial(base) {
  for (const len of [2, 1]) {
    const head = base.slice(0, len);
    if (INITIALS[head] && base.length > len) return [head, base.slice(len)];
  }
  return [null, base];
}

/** Zhuyin symbols (without tone) and tone for one syllable. */
export function toZhuyinParts(syllable) {
  const { base, tone } = parseSyllable(syllable);
  let symbols;
  if (ZERO_INITIAL[base]) {
    symbols = ZERO_INITIAL[base];
  } else {
    const [initial, rest] = splitInitial(base);
    if (!initial) throw new Error(`Unknown pinyin syllable: "${syllable}"`);
    let final = rest;
    if (final === 'i' && EMPTY_RHYME_INITIALS.has(initial)) {
      symbols = INITIALS[initial];
    } else {
      // After j/q/x, written "u" is really ü.
      if ('jqx'.includes(initial) && final.startsWith('u')) final = 'v' + final.slice(1);
      // "lü" / "nü" may be typed as lv / nv already.
      if (!FINALS[final]) throw new Error(`Unknown pinyin final in "${syllable}"`);
      if ((final === 'o') && !'bpmf'.includes(initial)) throw new Error(`Unexpected "o" final in "${syllable}"`);
      symbols = INITIALS[initial] + FINALS[final];
    }
  }
  return { symbols, tone };
}

/** "lao3" -> "ㄌㄠˇ", "ma5" -> "˙ㄇㄚ" */
export function toZhuyin(syllable) {
  const { symbols, tone } = toZhuyinParts(syllable);
  return tone === 5 ? '˙' + symbols : symbols + ZHUYIN_TONE[tone];
}

/** "lao3" -> "lǎo", "nv3" -> "nǚ", "ma5" -> "ma" */
export function toToneMarked(syllable) {
  const { base, tone } = parseSyllable(syllable);
  const plain = base.replace(/v/g, 'ü');
  if (tone === 5) return plain;
  let idx;
  if (plain.includes('a')) idx = plain.indexOf('a');
  else if (plain.includes('e')) idx = plain.indexOf('e');
  else if (plain.includes('ou')) idx = plain.indexOf('o');
  else {
    // Last vowel takes the mark (covers iu -> u, ui -> i).
    idx = -1;
    for (let i = plain.length - 1; i >= 0; i--) {
      if ('aeiouü'.includes(plain[i])) { idx = i; break; }
    }
  }
  if (idx < 0) throw new Error(`No vowel in "${syllable}"`);
  return plain.slice(0, idx) + TONE_MARKS[plain[idx]][tone - 1] + plain.slice(idx + 1);
}

/** "lao3 hu3" -> ["lao3", "hu3"] */
export function syllables(pinyin) {
  return pinyin.trim().split(/\s+/);
}

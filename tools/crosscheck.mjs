// Compare the pinyin of each word in js/data/words.js with the Taiwan Ministry of Education
// dictionary (教育部重編國語辭典修訂本, package @leonsilicon/moedict-data).
//
// - A word that is in the dictionary must have one of the dictionary readings.
// - A word that is not in the dictionary (for example 很冷 or 老師好) must use, for each
//   character, a reading that the dictionary gives for that character.
// Every line that this prints needs a person to check it.
import dict from '@leonsilicon/moedict-data';
import { DECKS } from '../js/data/words.js';

// Words that differ from the dictionary on purpose. A person checked each one.
const REVIEWED = {
  '姊姊': 'Taiwan textbooks read jiě jie. The word entry has the old reading zǐ zi; the character 姊 lists jiě first.',
  '它們': 'The word entry has the old reading tuō men; the character 它 lists tā first.',
  '魚兒': 'The dictionary writes the r-sound (yúr). The card shows 兒 as a neutral-tone syllable.',
};

const MARKS = { ā: 'a1', á: 'a2', ǎ: 'a3', à: 'a4', ē: 'e1', é: 'e2', ě: 'e3', è: 'e4', ī: 'i1', í: 'i2', ǐ: 'i3', ì: 'i4',
  ō: 'o1', ó: 'o2', ǒ: 'o3', ò: 'o4', ū: 'u1', ú: 'u2', ǔ: 'u3', ù: 'u4', ǖ: 'v1', ǘ: 'v2', ǚ: 'v3', ǜ: 'v4', ü: 'v0' };

// 'xǐ' → 'xi3'; a syllable with no tone mark is the neutral tone, 5.
function toNumber(syl) {
  let tone = 5;
  let out = '';
  for (const ch of syl.normalize('NFC')) {
    const m = MARKS[ch];
    if (m) { out += m[0]; if (m[1] !== '0') tone = Number(m[1]); } else out += ch;
  }
  return out.toLowerCase() + tone;
}

const entries = new Map();
for (const e of dict) if (!entries.has(e.title)) entries.set(e.title, e);

// All dictionary readings of a word or a character, as 'xi3 huan1'.
function readings(text) {
  const e = entries.get(text);
  if (!e) return [];
  const n = [...text].length;
  const out = new Set();
  for (const h of e.heteronyms ?? []) {
    if (!h.pinyin) continue;
    const parts = h.pinyin.replace(/（[^）]*）/g, ' ').replace(/[,，、-]/g, ' ').trim().split(/\s+/);
    if (n === 1) parts.forEach((p) => out.add(toNumber(p)));
    else if (parts.length === n) out.add(parts.map(toNumber).join(' '));
  }
  return [...out];
}

let problems = 0;
let notInDictionary = 0;
for (const deck of DECKS) {
  for (const word of deck.words) {
    if (REVIEWED[word.w]) continue;
    const ours = word.p.trim().split(/\s+/);
    const known = readings(word.w);
    if (known.length) {
      if (!known.includes(ours.join(' '))) {
        problems++;
        console.log(`WORD ${deck.id.padEnd(10)} ${word.w}\tours: ${word.p}\tdictionary: ${known.join(' / ')}`);
      }
      continue;
    }
    notInDictionary++;
    [...word.w].forEach((c, i) => {
      const r = readings(c);
      // A neutral tone is allowed on any character whose syllable matches.
      const ok = r.includes(ours[i]) || (ours[i].endsWith('5') && r.some((x) => x.slice(0, -1) === ours[i].slice(0, -1)));
      if (!ok) {
        problems++;
        console.log(`CHAR ${deck.id.padEnd(10)} ${word.w}\t${c} = ${ours[i]}\tdictionary: ${r.join(' / ') || '(none)'}`);
      }
    });
  }
}
console.log(`\n${problems} line(s) to check. ${notInDictionary} word(s) are not in the dictionary; their characters were checked.`);
console.log(`Reviewed on purpose: ${Object.keys(REVIEWED).join(' ')}`);
process.exitCode = 0;

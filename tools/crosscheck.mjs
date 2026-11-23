// Compare each word's pinyin in js/data/words.js with the pinyin-pro dictionary.
// pinyin-pro follows mainland (Putonghua) readings, so expect some differences
// on words marked `tw` (Taiwan reading). Every other difference needs a human check.
import { pinyin } from 'pinyin-pro';
import * as OpenCC from 'opencc-js';
import { DECKS } from '../js/data/words.js';

// pinyin-pro is built for Simplified characters, so convert Taiwan Traditional first.
const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' });

// Differences a person has already checked: pinyin-pro is wrong here, our data is right.
const REVIEWED = new Set(['謝謝', '餃子', '肚子', '肚子餓']);

const norm = (s) => s.replace(/v/g, 'ü');
let diffs = 0;
for (const deck of DECKS) {
  for (const word of deck.words) {
    const ref = pinyin(toSimplified(word.w), { toneType: 'num', type: 'array' })
      .map((s) => s.replace(/0$/, '5'))
      .join(' ');
    const ours = norm(word.p);
    if (norm(ref) !== ours && !REVIEWED.has(word.w)) {
      diffs++;
      console.log(`${word.tw ? 'TW  ' : 'DIFF'} ${deck.id.padEnd(10)} ${word.w}\tours: ${ours}\tpinyin-pro: ${norm(ref)}${word.tw ? '\t(' + word.tw + ')' : ''}`);
    }
  }
}
console.log(`\n${diffs} difference(s). Lines marked TW are expected Taiwan readings; DIFF lines need a human check.`);
process.exitCode = 0;

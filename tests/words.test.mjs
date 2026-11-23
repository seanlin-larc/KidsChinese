import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DECKS } from '../js/data/words.js';
import { LEVELS, CHARS, NOT_REQUIRED, levelOfWord } from '../js/data/levels.js';
import { syllables, toZhuyin } from '../js/pinyin.js';

const HAN = /^\p{Script=Han}+$/u;
const allWords = () => DECKS.flatMap((d) => d.words.map((w) => ({ ...w, deck: d.id })));

test('every word is valid', () => {
  for (const deck of DECKS) {
    assert.ok(deck.words.length >= 5, `${deck.id} has too few words`);
    assert.ok(deck.words.some((w) => w.lv === 1), `${deck.id} has no level-1 word`);
    for (const word of deck.words) {
      const where = `${deck.id}/${word.w}`;
      assert.match(word.w, HAN, `${where}: only Chinese characters`);
      const chars = [...word.w];
      assert.ok(chars.length >= 2 && chars.length <= 3, `${where}: must be 2–3 characters`);
      const syls = syllables(word.p);
      assert.equal(syls.length, chars.length, `${where}: one pinyin syllable per character`);
      for (const s of syls) assert.doesNotThrow(() => toZhuyin(s), `${where}: bad syllable ${s}`);
      assert.ok(word.en && word.en.length > 0, `${where}: needs an English meaning`);
    }
  }
});

test('the level of each word is the lowest level that has all its characters', () => {
  for (const word of allWords()) {
    const lv = levelOfWord(word.w);
    assert.ok(lv !== null, `${word.deck}/${word.w}: a character is not in the 3000-character list`);
    assert.equal(word.lv, lv, `${word.deck}/${word.w}: level must be ${lv}`);
  }
});

test('levels 1 and 2 use every one of their characters', () => {
  for (const level of LEVELS.filter((l) => l.lv <= 2)) {
    const used = new Set(allWords().filter((w) => w.lv <= level.lv).flatMap((w) => [...w.w]));
    const missing = [...CHARS.slice(0, level.size)].filter((c) => !used.has(c) && !NOT_REQUIRED.includes(c));
    assert.deepEqual(missing, [], `${level.zh} ${level.en}: no word uses ${missing.join('')}`);
  }
});

test('deck ids are unique, and a word is in one deck only', () => {
  const ids = DECKS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  const seen = new Map();
  for (const word of allWords()) {
    assert.ok(!seen.has(word.w), `${word.w} is in ${seen.get(word.w)} and ${word.deck}`);
    seen.set(word.w, word.deck);
  }
});

// OpenCC changes these to another form, but the Ministry of Education dictionary uses them as they are.
const MOE_FORMS = new Set(['公布', '分布']);

test('words use Taiwan Traditional characters (OpenCC check)', async (t) => {
  let OpenCC;
  try { OpenCC = await import('opencc-js'); } catch { t.skip('run npm install to enable this check'); return; }
  const toTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
  for (const word of allWords()) {
    if (MOE_FORMS.has(word.w)) continue;
    assert.equal(toTraditional(word.w), word.w, `${word.deck}/${word.w}: contains a Simplified character`);
  }
});

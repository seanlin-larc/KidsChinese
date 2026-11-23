import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DECKS } from '../js/data/words.js';
import { syllables, toZhuyin } from '../js/pinyin.js';

const HAN = /^\p{Script=Han}+$/u;

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
      assert.ok([1, 2, 3].includes(word.lv), `${where}: level must be 1, 2 or 3`);
      assert.ok(word.en && word.en.length > 0, `${where}: needs an English meaning`);
    }
  }
});

test('deck ids and words inside a deck are unique', () => {
  const ids = DECKS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const deck of DECKS) {
    const words = deck.words.map((w) => w.w);
    assert.equal(new Set(words).size, words.length, `${deck.id} has a duplicate word`);
  }
});

test('words use Taiwan Traditional characters (OpenCC check)', async (t) => {
  let OpenCC;
  try { OpenCC = await import('opencc-js'); } catch { t.skip('run npm install to enable this check'); return; }
  const toTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' });
  for (const deck of DECKS) {
    for (const word of deck.words) {
      assert.equal(toTraditional(word.w), word.w, `${deck.id}/${word.w}: contains a Simplified character`);
    }
  }
});

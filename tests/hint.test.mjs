import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hintText } from '../js/hint.js';
import { DECKS } from '../js/data/words.js';

test('the hint drops notes in brackets and keeps the first meaning', () => {
  assert.equal(hintText('dad'), 'dad');
  assert.equal(hintText("grandma (dad's mom)"), 'grandma');
  assert.equal(hintText('Mr.; husband'), 'Mr.');
  assert.equal(hintText('class starts / attend class'), 'class starts');
  assert.equal(hintText('wake (someone) up'), 'wake up');
  assert.equal(hintText('or (in questions); still'), 'or');
  assert.equal(hintText('hello, teacher'), 'hello, teacher');
});

test('every word has a short hint', () => {
  for (const w of DECKS.flatMap((d) => d.words)) {
    const h = hintText(w.en);
    assert.ok(h.length > 0 && h.length <= 30, `${w.w}: "${h}"`);
  }
});

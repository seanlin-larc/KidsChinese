import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as srs from '../js/srs.js';

const D = '2026-11-23';

test('date helpers', () => {
  assert.equal(srs.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(srs.addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(srs.daysBetween('2026-11-23', '2026-11-30'), 7);
  assert.equal(srs.today(new Date(2026, 0, 5)), '2026-01-05');
});

test('right answers move a card up the boxes', () => {
  let s = srs.newCardState();
  s = srs.review(s, true, D);
  assert.deepEqual([s.box, s.due], [1, '2026-11-24']);
  s = srs.review(s, true, '2026-11-24');
  assert.deepEqual([s.box, s.due], [2, '2026-11-27']);
  for (let i = 0; i < 10; i++) s = srs.review(s, true, D);
  assert.equal(s.box, srs.MAX_BOX);
  assert.equal(s.seen, 12);
  assert.equal(s.right, 12);
});

test('a wrong answer sends a card back to box 1, due today', () => {
  const s = srs.review({ box: 4, due: D, seen: 5, right: 5 }, false, D);
  assert.deepEqual([s.box, s.due, s.seen, s.right], [1, D, 6, 5]);
});

test('retry after a miss: right answer makes it due tomorrow, same box', () => {
  const missed = srs.review({ box: 3, due: D, seen: 3, right: 3 }, false, D);
  const s = srs.review(missed, true, D, { retry: true });
  assert.deepEqual([s.box, s.due], [1, '2026-11-24']);
});

test('extra practice does not move cards up early', () => {
  const s = srs.review({ box: 2, due: '2026-11-26', seen: 2, right: 2 }, true, D, { extra: true });
  assert.deepEqual([s.box, s.due], [2, '2026-11-26']);
  const fresh = srs.review(srs.newCardState(), true, D, { extra: true });
  assert.equal(fresh.box, 1);
});

test('pickSession: due first, then new, then extra practice', () => {
  const cards = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
  const progress = {
    a: { box: 2, due: '2026-11-30' },   // not due
    b: { box: 1, due: '2026-11-22' },   // due (older)
    c: { box: 3, due: '2026-11-23' },   // due
  };
  const s = srs.pickSession(cards, progress, D, 10);
  assert.deepEqual(s.cards.map((c) => c.id), ['b', 'c', 'd']);
  assert.equal(s.extra, false);
  assert.equal(srs.pickSession(cards, progress, D, 2).cards.length, 2);

  const allDone = { a: { box: 4, due: '2027-01-01' }, b: { box: 2, due: '2027-01-01' } };
  const extra = srs.pickSession(cards.slice(0, 2), allDone, D, 10);
  assert.equal(extra.extra, true);
  assert.deepEqual(extra.cards.map((c) => c.id), ['b', 'a']);
});

test('deck stars', () => {
  const cards = [1, 2, 3, 4, 5, 6].map((i) => ({ id: String(i) }));
  const m = { box: 3 };
  assert.equal(srs.deckStars(cards, {}), 0);
  assert.equal(srs.deckStars(cards, { 1: m, 2: m }), 1);
  assert.equal(srs.deckStars(cards, { 1: m, 2: m, 3: m, 4: m, 5: m }), 2);
  assert.equal(srs.deckStars(cards, { 1: m, 2: m, 3: m, 4: m, 5: m, 6: m }), 3);
});

test('streaks', () => {
  let st = srs.updateStreak(undefined, '2026-11-20');
  assert.equal(st.count, 1);
  st = srs.updateStreak(st, '2026-11-20');
  assert.equal(st.count, 1);
  st = srs.updateStreak(st, '2026-11-21');
  assert.equal(st.count, 2);
  assert.equal(srs.currentStreak(st, '2026-11-22'), 2);
  assert.equal(srs.currentStreak(st, '2026-11-23'), 0);
  st = srs.updateStreak(st, '2026-11-24');
  assert.equal(st.count, 1);
});

// Spaced repetition with Leitner boxes.
//
// Each card has a box 0–5. Box 0 = never studied.
// "Got it"  -> move up one box; next review after INTERVAL_DAYS[box] days.
// "Not yet" -> back to box 1; review again today.
// A card in box 3 or higher counts as "mastered".

export const INTERVAL_DAYS = [0, 1, 3, 7, 14, 30];
export const MAX_BOX = INTERVAL_DAYS.length - 1;
export const MASTERED_BOX = 3;

/** Local calendar date as "YYYY-MM-DD". */
export function today(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  const toUtc = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((toUtc(b) - toUtc(a)) / 86400000);
}

export function newCardState() {
  return { box: 0, due: null, seen: 0, right: 0 };
}

/**
 * Apply one answer to a card state. Returns a new state.
 * extra = true for "practice anyway" sessions: a right answer does not move
 * the card up early, but a wrong answer still sends it back to box 1.
 * retry = true when a card missed earlier in the same session comes back:
 * a right answer keeps it in its box and makes it due tomorrow.
 */
export function review(state, gotIt, date, { extra = false, retry = false } = {}) {
  const s = { ...newCardState(), ...state };
  s.seen += 1;
  if (gotIt) {
    s.right += 1;
    if (retry) {
      s.box = Math.max(s.box, 1);
      s.due = addDays(date, 1);
    } else if (!extra || s.box === 0) {
      s.box = Math.min(s.box + 1, MAX_BOX);
      s.due = addDays(date, INTERVAL_DAYS[s.box]);
    }
  } else {
    s.box = 1;
    s.due = date;
  }
  return s;
}

export function isDue(state, date) {
  return !!state && state.box > 0 && state.due !== null && state.due <= date;
}

export function isMastered(state) {
  return !!state && state.box >= MASTERED_BOX;
}

/**
 * Pick cards for a session.
 * cards: [{ id, ... }] in deck order; progress: { [id]: state }.
 * Due cards first (oldest due first), then new cards, up to `size`.
 * If nothing is due or new, returns the weakest cards with extra = true.
 */
export function pickSession(cards, progress, date, size) {
  const due = cards
    .filter((c) => isDue(progress[c.id], date))
    .sort((a, b) => progress[a.id].due.localeCompare(progress[b.id].due));
  const fresh = cards.filter((c) => !progress[c.id] || progress[c.id].box === 0);
  const picked = [...due, ...fresh].slice(0, size);
  if (picked.length > 0) return { cards: picked, extra: false };
  const weakest = [...cards].sort((a, b) => (progress[a.id]?.box ?? 0) - (progress[b.id]?.box ?? 0));
  return { cards: weakest.slice(0, size), extra: true };
}

/** 0–3 stars for a deck, by share of mastered cards. 3 stars only when all are mastered. */
export function deckStars(cards, progress) {
  if (cards.length === 0) return 0;
  const mastered = cards.filter((c) => isMastered(progress[c.id])).length;
  if (mastered === cards.length) return 3;
  return Math.min(2, Math.floor((3 * mastered) / cards.length));
}

/** Update the day streak after practising on `date`. */
export function updateStreak(streak, date) {
  const s = { count: 0, last: null, ...streak };
  if (s.last === date) return s;
  const gap = s.last ? daysBetween(s.last, date) : null;
  return { count: gap === 1 ? s.count + 1 : 1, last: date };
}

/** Streak to show: 0 if the child missed a full day. */
export function currentStreak(streak, date) {
  if (!streak || !streak.last) return 0;
  return daysBetween(streak.last, date) <= 1 ? streak.count : 0;
}

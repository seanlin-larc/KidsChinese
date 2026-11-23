// Wrong-PIN lock (same as Kids Games and Reads). This file has no Firebase code.
//
// 10 wrong PINs in a row lock that account for 30 minutes, on this device only.
// localStorage key "kg-lock", SHARED with the Kids Games site (same accounts, same site, same
// format): { CODE: { fails } } or { CODE: { fails: 0, at, until } } when locked. So wrong PINs on
// either site count together, and a lock covers both sites.
// A user who clears the site data or uses another browser removes it.
// It stops mistakes and casual tries; it is not a hard guard. Firebase checks the PIN
// and also slows down many wrong tries on its server.

export const LOCK_FAILS = 10;     // wrong PINs in a row before a lock
export const LOCK_MINUTES = 30;   // length of the lock

const KEY = 'kg-lock';

function read() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return v && typeof v === 'object' ? v : {}; }
  catch { return {}; }
}
function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} }

// Returns { locked, until, left } for one account. "left" = wrong PINs left before the lock.
export function lockState(code, now = Date.now()) {
  const all = read();
  const s = all[code];
  if (!s) return { locked: false, until: 0, left: LOCK_FAILS };
  if (s.until) {
    // A device clock that is set back (now < at) keeps the lock.
    if (now < s.until || now < s.at) return { locked: true, until: Math.max(s.until, now + 60000), left: 0 };
    delete all[code];
    write(all);
    return { locked: false, until: 0, left: LOCK_FAILS };
  }
  return { locked: false, until: 0, left: Math.max(0, LOCK_FAILS - (s.fails || 0)) };
}

// Counts one wrong PIN. Returns the new lockState.
export function recordFail(code, now = Date.now()) {
  const all = read();
  const s = all[code] || { fails: 0 };
  s.fails = (s.fails || 0) + 1;
  all[code] = s.fails >= LOCK_FAILS ? { fails: 0, at: now, until: now + LOCK_MINUTES * 60 * 1000 } : s;
  write(all);
  return lockState(code, now);
}

// A correct PIN clears the counter.
export function recordSuccess(code) {
  const all = read();
  if (all[code]) { delete all[code]; write(all); }
}

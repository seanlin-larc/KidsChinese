// The family accounts. This file has no Firebase code, so pages can show the sign-in
// buttons before Firebase loads.
//
// KidsChinese uses the Kids Games Firebase project (kidsgame-7a262) and its accounts.
// Each person has one Firebase Email/Password account, <code>@kidsgames.invalid.
// The 6-digit PIN is the password (the same PIN as Kids Games). Firebase checks the PIN on its
// server; no PIN or PIN hash is in this public code. The page takes the code and role from the
// email. The Firestore rules check the role with players/{uid}.code, as Kids Games does.
// The Kids Games Guest account cannot use KidsChinese.
//
// Roles:
//   learner – studies flash cards; can change only their own progress and preferences.
//   parent  – sees the parent page: sets each learner's level, resets progress, views progress.
// The Firestore rules (KidsChinese block in kidsgames/firebase/firestore.rules) enforce the
// same roles on the server.
//
// To add a person: the account must exist in Kids Games (Firebase Authentication and
// players/{uid}). Add one line here, and add the code to the KidsChinese block of
// kidsgames/firebase/firestore.rules.

export const EMAIL_DOMAIN = '@kidsgames.invalid';

export const ACCOUNTS = [
  { code: 'YC', email: 'yc@kidsgames.invalid', role: 'learner' },
  { code: 'JY', email: 'jy@kidsgames.invalid', role: 'learner' },
  { code: 'SL', email: 'sl@kidsgames.invalid', role: 'parent' },
  { code: 'CJ', email: 'cj@kidsgames.invalid', role: 'parent' },
];

export const LEARNERS = ACCOUNTS.filter((a) => a.role === 'learner').map((a) => a.code);
export const PARENTS = ACCOUNTS.filter((a) => a.role === 'parent').map((a) => a.code);

/** The account for an email, or null. */
export function accountForEmail(email) {
  const e = String(email || '').toLowerCase();
  return ACCOUNTS.find((a) => a.email === e) ?? null;
}

export function accountForCode(code) {
  return ACCOUNTS.find((a) => a.code === code) ?? null;
}

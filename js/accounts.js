// The family accounts. This file has no Firebase code, so pages can show the sign-in
// buttons before Firebase loads.
//
// Each person has one Firebase Email/Password account, <code>@kidschinese.invalid.
// The 6-digit PIN is the password. Firebase checks the PIN on its server; no PIN or
// PIN hash is in this public code. The person's code and role come from the email.
//
// Roles:
//   learner – studies flash cards; can change only their own progress and preferences.
//   parent  – sees the parent page: sets each learner's level, resets progress, views progress.
// The Firestore rules (firebase/firestore.rules) enforce the same roles on the server.
//
// To add a person: make the account in Firebase Authentication, add one line here, and add
// the email to firebase/firestore.rules.

export const EMAIL_DOMAIN = '@kidschinese.invalid';

export const ACCOUNTS = [
  { code: 'YC', email: 'yc@kidschinese.invalid', role: 'learner' },
  { code: 'JY', email: 'jy@kidschinese.invalid', role: 'learner' },
  { code: 'SL', email: 'sl@kidschinese.invalid', role: 'parent' },
  { code: 'CJ', email: 'cj@kidschinese.invalid', role: 'parent' },
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

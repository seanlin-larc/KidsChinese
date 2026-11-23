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
//   learner – a child (YC, JY). Studies flash cards; can change only their own progress and
//             preferences. A parent sets the level.
//   parent  – an adult (SL, CJ, 嬤). Studies flash cards too (own progress, own level), and sees
//             the parent page: sets each child's level, resets a child's progress, views progress.
// The Firestore rules (KidsChinese block in kidsgames/firebase/firestore.rules) enforce the
// same roles on the server.
//
// code – the Kids Games player code: players/{uid}.code, and the Firestore document chinese/{code}.
// name – what the page shows. It is the code, except 嬤 (code AMA).
//
// To add a person: the account must exist in Kids Games (Firebase Authentication and
// players/{uid}). Add one line here, and add the code to the KidsChinese block of
// kidsgames/firebase/firestore.rules (kcLearnerCode or kcParentCode).
// firebase/SETUP.md, section 3, has the steps.

export const EMAIL_DOMAIN = '@kidsgames.invalid';

export const ACCOUNTS = [
  { code: 'YC', name: 'YC', email: 'yc@kidsgames.invalid', role: 'learner' },
  { code: 'JY', name: 'JY', email: 'jy@kidsgames.invalid', role: 'learner' },
  { code: 'SL', name: 'SL', email: 'sl@kidsgames.invalid', role: 'parent' },
  { code: 'CJ', name: 'CJ', email: 'cj@kidsgames.invalid', role: 'parent' },
  { code: 'AMA', name: '嬤', email: 'ama@kidsgames.invalid', role: 'parent' },
];

export const LEARNERS = ACCOUNTS.filter((a) => a.role === 'learner').map((a) => a.code);
export const PARENTS = ACCOUNTS.filter((a) => a.role === 'parent').map((a) => a.code);

/** The name to show for an account code (for example 嬤 for AMA). */
export function nameOf(code) {
  return accountForCode(code)?.name ?? String(code);
}

/** The account for an email, or null. */
export function accountForEmail(email) {
  const e = String(email || '').toLowerCase();
  return ACCOUNTS.find((a) => a.email === e) ?? null;
}

export function accountForCode(code) {
  return ACCOUNTS.find((a) => a.code === code) ?? null;
}

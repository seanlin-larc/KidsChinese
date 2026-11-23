# CLAUDE.md — KidsChinese

Read this file and `README.md` before you change anything.

## What this is

Traditional Chinese flash cards (Zhuyin + Pinyin answers) for YC and JY, with parent controls for SL and CJ.
Static pages on GitHub Pages (`main` / root = the live site). It uses the **Kids Games** Firebase project
(`kidsgame-7a262`) and accounts; one sign-in covers both sites. Data is in the Firestore collection `chinese`. The owner is not a professional programmer: keep code simple and readable.
No build step, no framework. Plain HTML, CSS and ES modules.

## Hard rules

- **This repo is public.** Never commit a PIN, password, service account key or token.
- **Never type or ask for a real PIN.** Tests use the emulators with fake PINs.
- **Firestore rules live in the Kids Games repo** (`firebase/firestore.rules`, block "KidsChinese"), because the
  database has one set of rules. Test them there (`cd firebase && npm test`, Kids Games and KidsChinese together).
  A parent publishes the **complete** file in the Firebase console. Do not deploy anything to Firebase. Do not
  change Firebase or Google Cloud settings; say what to change and why.
- Never sign out an account automatically: the sign-in is shared with Kids Games.
- When an account changes, change `js/accounts.js` and the Kids Games rules together (`tests/accounts.test.mjs` checks this).
- Push to `main` only when asked. `main` is the live site.

## Code rules

- All Firebase code is in `js/firebase/auth.js`. Other files have no Firebase code.
- Firebase web SDK 13.0.0 from `https://www.gstatic.com/firebasejs/13.0.0/` (same as Kids Games and Reads).
- Relative links only. Shared keys with Kids Games: `kg-lock`, `kg-lastPlayer`. New own keys start with `kc-`.
- Pronunciation follows Taiwan (教育部) readings. Store pinyin with tone numbers; Zhuyin is generated.
- Phone first: check at 390 px wide, tap targets at least 44 px.

## Tests (run before every commit)

- `npm test` (unit tests) and `npm run crosscheck` after word changes.
- `cd firebase && npm run e2e` (with a Kids Games checkout next to this repo) after a change to sign-in, saving, the parent page or the rules.

## Writing

Docs, comments and messages close to ASD-STE100 Simplified Technical English: short sentences, active voice,
one term for one meaning.

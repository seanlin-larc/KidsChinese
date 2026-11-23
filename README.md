# 學中文 Flash Cards (KidsChinese)

Flash cards for kids who learn Mandarin at Saturday school.
The card shows a word in **Traditional characters** (2–3 characters).
The child reads it, then flips the card to check the answer in **Zhuyin (注音)** and **Pinyin**.

It is a static web page (no build step) on GitHub Pages. Firebase handles the sign-in and saves progress, the same way as Kids Games and Reads.

## Features

- **13 topic decks, 186 words** (101 at level 1, 74 at level 2, 11 at level 3): family, greetings, animals, food, colours, body, school, weather & seasons, time, actions, places, transport, feelings.
- **3 levels**. Level 1 is for a beginner. Levels 2 and 3 add harder words.
- **Answer side in Taiwan textbook style**: Zhuyin runs vertically to the right of each character. Pinyin is below. The English meaning is optional.
- **Listen button**: the browser reads the word aloud. It uses a Taiwan Mandarin (zh-TW) voice when the device has one.
- **Family accounts with a PIN**: YC and JY are learners. SL and CJ are parents. Each person signs in with a 6-digit PIN. 10 wrong PINs lock that account on the device for 30 minutes.
- **Progress follows the child**: answers, stars and streaks are saved in Firestore, so they move between the iPad and the computer. After the first sign-in, the app also works offline and sends the answers later.
- **Parent page** (SL, CJ only): set each child's level, see each child's progress (words learned, stars, streak, progress by deck, words with the most misses), and reset a child's progress. The Firestore rules enforce this on the server: a child cannot change their own level, reset progress, or see the other child's data.
- **Spaced repetition** (Leitner boxes). A card the child knows comes back after 1, 3, 7, 14, then 30 days. A missed card comes back later in the same round, and again the next day.
- **Rewards**: one star for each right answer, a bonus for a perfect round, a daily goal of 10 cards, and 0–3 stars for each deck.

## First-time setup: Firebase

The site needs its own Firebase project. Follow [firebase/SETUP.md](firebase/SETUP.md) one time: create the
project, the four accounts with PINs, Firestore with the rules in
[firebase/firestore.rules](firebase/firestore.rules), and the API key restriction.
Until then, the site shows "Not set up yet".

## Accounts and account control

| Account | Role | Can do |
|---|---|---|
| YC, JY | learner | Study, see and save own progress, change own display settings |
| SL, CJ | parent | Parent page: set levels, view both children's progress, reset progress |

- Emails are `<code>@kidschinese.invalid` (Firebase Email/Password). The PIN is the password. Firebase checks it. No PIN is in this code.
- The code and the role come from the email (`js/accounts.js`). There is no `players` collection.
- **Sign-in stays** on the device until **Sign out**. On a shared iPad, sign out before the other child plays.
- **Wrong-PIN lock:** 10 wrong PINs in a row lock that account for 30 minutes on that device (`kc-lock`). This check is in the page only; Firebase also slows down many wrong tries.
- **Forgotten PIN:** run `admin/reset-pin.mjs` on a parent computer. See [admin/README.md](admin/README.md).
- **Offline:** the first sign-in on a device needs internet. After that, Firebase restores the sign-in without internet, and Firestore keeps the answers on the device until it is online. An "⚠️ Offline" mark shows when there is no internet.

Firestore data:

```
learners/{YC|JY}                 level (parents write)
learners/{YC|JY}/data/summary    stars, streak, today's count (the child writes)
learners/{YC|JY}/data/prefs      Pinyin, English, cards per round, voice speed, animal
learners/{YC|JY}/cards/{cardId}  box, due date, times seen, times right (the child writes)
```

## Run it on your computer

Any static file server works. Use port 8000: the API key accepts only `seanlin-larc.github.io` and `localhost:8000`.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` directly from disk does not work, because browsers block ES modules on `file://`.

## Put it online with GitHub Pages (free)

1. On GitHub, open **Settings → Pages**.
2. Set **Source** to *Deploy from a branch*.
3. Select branch `main` and folder `/ (root)`, then click **Save**.
4. After about a minute, the site is at `https://<your-user>.github.io/KidsChinese/`.

On an iPad or phone, use **Share → Add to Home Screen** to get an app icon.

## Important limits

- **The first sign-in on each device needs internet.** The Firebase code downloads from `www.gstatic.com`.
- **Progress saved before accounts** (in the browser only, version 0.1) is not moved to Firestore.
- **The listen button depends on the device's voices.** iPad, Mac and most Android devices include a Mandarin voice. On Windows, add the "Chinese (Traditional, Taiwan)" voice in system settings if no Mandarin voice is found. The Settings screen tells you if one is available.
- **Tones are dictionary tones.** Tone changes in speech (for example, 3rd + 3rd tone → 2nd + 3rd) are not marked. This matches how most textbooks print Zhuyin.

## Pronunciation follows Taiwan (教育部) standard

Zhuyin textbooks follow the Taiwan Ministry of Education readings, so this app does too.
A few words are different from the mainland reading. These words have a `tw` note in the data and a small "臺灣讀音" label on the card:

| Word | Taiwan (used here) | Mainland |
|---|---|---|
| 姊姊 | jiě jie (ㄐㄧㄝˇ ˙ㄐㄧㄝ) | zǐ zǐ / written 姐姐 |
| 星期一, 星期天 | xīng qí | xīng qī |
| 頭髮 | tóu fǎ | tóu fa |
| 嘴巴 | zuǐ bā | zuǐ ba |
| 眼睛 | yǎn jīng | yǎn jing |
| 喜歡 | xǐ huān | xǐ huan |
| 對不起 | duì bù qǐ | duì bu qǐ |

If your teacher teaches a different reading, change the `p` value of that word in `js/data/words.js`.

## Add or change words

Edit `js/data/words.js`. Each word looks like this:

```js
{ w: '老虎', p: 'lao3 hu3', en: 'tiger', lv: 1 },
```

- `w`: the word in Traditional characters (2–3 characters).
- `p`: pinyin with tone numbers, one syllable for each character. Use `5` for the neutral tone and `v` for ü (`lv4` = lǜ).
- `en`: English meaning.
- `lv`: level 1, 2 or 3.

You do not type Zhuyin. The app makes Zhuyin and tone marks from `p`.

To add a new topic, add a new deck object with `id`, `name`, `en`, `icon` and `words`.

Then run the checks:

```bash
npm install
```

```bash
npm test
```

```bash
npm run crosscheck
```

`npm test` checks that every word has 2–3 Traditional characters, one valid pinyin syllable for each character, and a level. It also tests the Zhuyin converter, the review schedule, and that `js/accounts.js` and the Firestore rules list the same accounts.

`npm run crosscheck` compares your pinyin with the `pinyin-pro` dictionary. Lines marked `TW` are expected Taiwan readings. Lines marked `DIFF` need a person to check them.

### Firebase tests (rules and the whole app)

Needs Java 11 or later. In the `firebase/` folder:

```bash
npm install
```

```bash
npm test
```

```bash
npm run e2e
```

- `npm test` checks `firestore.rules` in the Firestore emulator: who can read, write, set levels and reset.
- `npm run e2e` runs the real app with the real Firebase SDK in headless Chromium against the Auth and Firestore emulators: not-set-up message, wrong PIN, sign-in, a study round saved to Firestore, offline answers sent later, the parent page (set a level, reset), and the 10-PIN lock. It needs Playwright with Chromium.
- The project ID is `demo-kidschinese`, so the emulators never contact the real project. The test PINs exist only in the emulator.
- For a manual check against the emulators, open `http://localhost:8000/?emulator` (works on localhost only).

## Project layout

```
index.html               page shell
css/style.css            styles (light and dark)
js/app.js                screens: sign-in, learner home, study, settings, parent page
js/accounts.js           the four accounts and their roles (no Firebase)
js/lock.js               wrong-PIN lock on the device (no Firebase)
js/load.js               loads the Firebase code with a time limit; who is signed in (no Firebase)
js/stuck.js              "The page did not load. Reload the page." message
js/firebase/config.js    Firebase web config (null until setup) and SDK version
js/firebase/auth.js      all Firebase code: sign-in, progress, parent controls
js/data/words.js         the word decks
js/pinyin.js             pinyin → Zhuyin and tone marks
js/srs.js                spaced-repetition schedule, stars, streaks
js/speech.js             read-aloud
firebase/firestore.rules Firestore security rules (a parent publishes them in the console)
firebase/SETUP.md        one-time Firebase console steps
firebase/tests/          rules test and end-to-end test (emulators)
admin/reset-pin.mjs      set a new PIN (parent computer only)
tests/                   unit tests (node --test)
tools/crosscheck.mjs     pinyin dictionary cross-check
```

## Device storage keys

All keys start with `kc-`: `kc-lock` (wrong-PIN counter), `kc-lastAccount` (last account picked on this device).
Firebase also keeps its sign-in and the Firestore copy in the browser's IndexedDB.

## Why spaced repetition and self-testing

- Spreading practice over days gives better long-term memory than the same practice in one block. See the meta-analysis by Cepeda et al. (2006), *Psychological Bulletin*: https://doi.org/10.1037/0033-2909.132.3.354
- Trying to recall an answer before seeing it (the "read it, then flip" step) gives better memory than reading the answer again. See Roediger & Karpicke (2006), *Psychological Science*: https://doi.org/10.1111/j.1467-9280.2006.01693.x

The exact intervals here (1, 3, 7, 14, 30 days) are a common default, not a tested optimum for children.

# 學中文 Flash Cards (KidsChinese)

繁體中文版：[README_zhtw.md](README_zhtw.md)

Flash cards for kids who learn Mandarin at Saturday school.
The card shows a word in **Traditional characters** (2–3 characters).
The child reads it, then flips the card to check the answer in **Zhuyin (注音)** and **Pinyin**.

It is a static web page (no build step) on GitHub Pages. It uses the **Kids Games** Firebase project and accounts for sign-in and to save progress.

## Features

- **28 topic decks (scenarios), 1,635 words**: family, greetings, people, animals, food, colours, body, health, home, school, learning, weather, nature, time, numbers, actions, talking, feelings, describing words, everyday words, places, transport, shopping, play, music & art, holidays, stories, countries & society.
- **4 levels, set by characters** (see [Levels](#levels)): 學前 Starters (929 words), 初階 Beginner (+583), 四年級 Grade 4 (+97), 小學 Elementary (+26). The words use every one of the 1000 characters of levels 1 and 2.
- **Answer side in Taiwan textbook style**: Zhuyin runs vertically to the right of each character. Pinyin is below. The English meaning is optional.
- **Listen button**: the browser reads the word aloud. It uses a Taiwan Mandarin (zh-TW) voice when the device has one.
- **Kids Games accounts and PINs**: YC and JY are learners. SL, CJ and 嬤 (grandma) are parents, and they can also study with their own progress. Guest cannot use KidsChinese. One sign-in covers Kids Games and KidsChinese on a device. 10 wrong PINs (on either site) lock that account on the device for 30 minutes.
- **Progress follows the child**: answers, stars and streaks are saved in Firestore, so they move between the iPad and the computer. After the first sign-in, the app also works offline and sends the answers later.
- **Parent page** (SL, CJ, 嬤 only): set each child's level, see each child's progress (words learned, stars, streak, progress by deck, words with the most misses), and reset a child's progress. The Firestore rules enforce this on the server: a child cannot change their own level, reset progress, or see the other child's data.
- **Spaced repetition** (Leitner boxes). A card the child knows comes back after 1, 3, 7, 14, then 30 days. A missed card comes back later in the same round, and again the next day.
- **Rewards**: one star for each right answer, a bonus for a perfect round, a daily goal of 10 cards, and 0–3 stars for each deck.

## Levels

A level is a set of characters. The characters come from the Taiwan Ministry of Education list in
order of frequency (教育部字庫 5021 字, 字頻 order). Each level contains the levels below it.

| Level | Characters | Words now | All characters used? |
|---|---|---|---|
| 1 學前 Starters | the 600 most frequent (1–600) | 929 | Yes |
| 2 初階 Beginner | 1–1000 | 929 + 583 | Yes |
| 3 四年級 Grade 4 | 1–1800 | + 97 | Not yet |
| 4 小學 Elementary | 1–3000 | + 26 | Not yet |

- The level of a word is the lowest level that has all of its characters. `npm test` checks this.
  Example: 香蕉 is level 4, because 蕉 is character 1883.
- `npm test` also checks that the words use every character of levels 1 and 2. Two characters are not
  required: 台 and 裏. The Ministry of Education dictionary lists them as variant forms (異體字) of 臺 and 裡,
  and the cards use 臺 and 裡.
- The character list is in `js/data/levels.js`.

Sources (checked 2026-11-23):

- The 600 characters of the sidonie.ca flash cards (https://sidonie.ca/diy-chinese-flash-cards/) are the
  first 600 characters of the Ministry list. The site says that both use the same order.
  The Pinyin PDF on that site has 4 characters two times (心雨手變) and does not have 便兩新首,
  so this app uses the Ministry list.
- Two Google Sheets ("1000 characters, grades 1–2" and "1800 characters, grades 1–4") were **not used**.
  They do not agree with the Ministry list: the 1000 sheet does not have 上 生 用 什 長;
  the 1800 sheet does not have 一 是 我 人, and 513 of its characters are not in the 3000 most frequent
  (for example 佞 饕 匭). Also, 376 characters of the 1000 sheet are not in the 1800 sheet.
- **Frequency is not the same as "easy for a child".** The list counts characters in general texts.
  So 香蕉 (banana) and 阿姨 (aunt) are level 4, and 政府 (government) is level 2.

Levels 3 and 4 need more words. To add them, follow [Add or change words](#add-or-change-words).

**Level 4 needs the Kids Games rules update.** Status (2026-11-23): done. Sean published the rules that accept
levels 1–4 (Kids Games `main`, commit `b91fa7b`). See
[docs/2026-11-23_kidsgames-rules-update-handoff.md](docs/2026-11-23_kidsgames-rules-update-handoff.md).

The level numbers stay the same in Firestore, but their names changed on 2026-11-23:
1 初級 → 學前, 2 中級 → 初階, 3 高級 → 四年級. A child who had level 2 now has 初階 Beginner (1000 characters).

## First-time setup: Firebase

KidsChinese uses the Kids Games project (`kidsgame-7a262`), so the accounts, PINs and API key already exist.
One step is left: publish the Kids Games rules file that has the KidsChinese block, then set the levels.
See [firebase/SETUP.md](firebase/SETUP.md). Until the rules are published, the site shows "Cannot read progress".

Status (2026-11-23): Sean published the rules update. Kids Games `main` has the same file (commit `b91fa7b`).

## Accounts and account control

| Account | Role | Can do |
|---|---|---|
| YC, JY | learner | Study, see and save own progress, change own display settings |
| SL, CJ, 嬤 (code `AMA`) | parent | Parent page: set levels, view both children's progress, reset progress. Also study with own progress and own level (a test player) |
| Guest | — | Nothing. The page asks Guest to sign out |

- The accounts are the Kids Games accounts, `<code>@kidsgames.invalid` (Firebase Email/Password). The PIN is the password (the same PIN as Kids Games). Firebase checks it. No PIN is in this code.
- The page shows each account's `name` (嬤 for `AMA`, the code for the others).
- Parents need the Kids Games rules update of 2026-11-23 to study and to use 嬤
  (see [firebase/SETUP.md](firebase/SETUP.md), sections 1 and 3).
- The page takes the code and role from the email (`js/accounts.js`), so it also works offline. The Firestore rules check the role with the Kids Games `players/{uid}` document. Delete that document to remove an account's access to both sites.
- **One sign-in for both sites** on a device (same project, same website). A sign-out on one site also signs out of the other. On a shared iPad, sign out before the other child plays.
- **Wrong-PIN lock:** 10 wrong PINs in a row lock that account for 30 minutes on that device. The lock key `kg-lock` is shared with Kids Games. This check is in the page only; Firebase also slows down many wrong tries.
- **Forgotten PIN:** use `admin/reset-pin.mjs` in the Kids Games repo.
- **Offline:** the first sign-in on a device needs internet. After that, Firebase restores the sign-in without internet, and Firestore keeps the answers on the device until it is online. An "⚠️ Offline" mark shows when there is no internet.

Firestore data:

Collection `chinese` in the shared Kids Games database:

```
chinese/{code}                  level (parents write)
chinese/{code}/data/summary     stars, streak, today's count (the account itself writes)
chinese/{code}/data/prefs       Pinyin, English, cards per round, voice speed, avatar (not shown)
chinese/{code}/cards/{cardId}   box, due date, times seen, times right (the account itself writes)
{code} = YC, JY, SL, CJ or AMA
```

The rules for this collection are the "KidsChinese" block in `kidsgames/firebase/firestore.rules`.
KidsChinese has no rules file of its own, because a Firestore database has one set of rules.

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
The pinyin of each word comes from the Ministry dictionary (教育部重編國語辭典修訂本).
When a word has two readings, the card uses the reading for the meaning in `en` (for example 東西 dōng xi = thing).
Some words are different from the mainland reading. These words have a `tw` note in the data and a small "臺灣讀音" label on the card. Examples:

| Word | Taiwan (used here) | Mainland |
|---|---|---|
| 姊姊 | jiě jie (ㄐㄧㄝˇ ˙ㄐㄧㄝ) | zǐ zǐ; usually written 姐姐 (jiě jie) |
| 星期, 星期一 | xīng qí | xīng qī |
| 垃圾 | lè sè | lā jī |
| 研究 | yán jiù | yán jiū |
| 微笑 | wéi xiào | wēi xiào |
| 機場, 市場 | jī cháng, shì cháng | jī chǎng, shì chǎng |
| 流血 | liú xiě | liú xuè |
| 喜歡 | xǐ huān | xǐ huan |

Two words differ from their dictionary entry on purpose: 姊姊 (textbooks read jiě jie) and 它們 (tā men).
`tools/crosscheck.mjs` lists them.

On 2026-11-23 four older words changed to the dictionary reading: 對不起 duì bu qǐ, 嘴巴 zuǐ ba,
早上 zǎo shang and 晚上 wǎn shang (neutral tone), and 機場 jī cháng.

If your teacher teaches a different reading, change the `p` value of that word in `js/data/words.js`.

## Add or change words

Edit `js/data/words.js`. Each word looks like this:

```js
{ w: '老虎', p: 'lao3 hu3', en: 'tiger', lv: 1 },
```

- `w`: the word in Traditional characters (2–3 characters).
- `p`: pinyin with tone numbers, one syllable for each character. Use `5` for the neutral tone and `v` for ü (`lv4` = lǜ).
- `en`: English meaning.
- `lv`: level 1–4. It must be the lowest level that has all the characters of the word (see [Levels](#levels)).

You do not type Zhuyin. The app makes Zhuyin and tone marks from `p`.

To add a new topic, add a new deck object with `id`, `name`, `en`, `icon` and `words`.
Do not change the `id` of a deck or move a word to another deck: the saved progress of a card uses the deck id and the word.

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

`npm test` checks that every word has 2–3 Traditional characters, one valid pinyin syllable for each character, and the correct level, that levels 1 and 2 use all their characters, and that a word is in one deck only. It also tests the Zhuyin converter, the review schedule, the account list, and (when a Kids Games checkout is next to this repo, or `KIDSGAMES_RULES` is set) that the Kids Games rules have the same learner and parent codes.

After a word change, also update the word-list notes in the `notes-with-llm` repo (next to this repo):

```bash
node tools/export-notes.mjs ../notes-with-llm/projects/kidsChinese/words
```

`npm run crosscheck` compares your pinyin with the Ministry of Education dictionary (npm package `@leonsilicon/moedict-data`, from the g0v moedict data). A word that is in the dictionary must have a dictionary reading. For a word that is not in the dictionary, each character must have a dictionary reading. Each line that it prints needs a person to check it.

### Firebase tests

- **Rules test:** in the Kids Games repo, `cd firebase && npm test`. It tests the Kids Games rules and the KidsChinese block together (`tests/kidschinese.rules.test.mjs`).
- **End-to-end test** (this repo): needs Java 11 or later, Playwright with Chromium, and a Kids Games checkout next to this repo (or `KIDSGAMES_RULES=<path to firestore.rules>`). In the `firebase/` folder:

  ```bash
  npm install
  ```

  ```bash
  npm run e2e
  ```

  It runs the real app with the real Firebase SDK in headless Chromium against the Auth and Firestore emulators, with the Kids Games rules: Guest refused (and not signed out), wrong PIN, sign-in, a study round saved to Firestore, offline answers sent later, the parent page (set a level, reset), and the 10-PIN lock.
- The emulator project ID is `demo-kidsgames`, so the emulators never contact the real project. The test PINs exist only in the emulator.
- For a manual check against the emulators, open `http://localhost:8000/?emulator` (works on localhost only).

## Project layout

```
index.html               page shell
css/style.css            styles (light and dark)
js/app.js                screens: sign-in, learner home, study, settings, parent page
js/accounts.js           the five accounts, their names and roles (no Firebase)
js/lock.js               wrong-PIN lock on the device (no Firebase)
js/load.js               loads the Firebase code with a time limit; who is signed in (no Firebase)
js/stuck.js              "The page did not load. Reload the page." message
js/firebase/config.js    Firebase web config (Kids Games project) and SDK version
js/firebase/auth.js      all Firebase code: sign-in, progress, parent controls
js/data/words.js         the word decks
js/data/levels.js        the four levels and the 3000 characters
js/pinyin.js             pinyin → Zhuyin and tone marks
js/srs.js                spaced-repetition schedule, stars, streaks
js/speech.js             read-aloud
firebase/SETUP.md        what to publish in the Firebase console
firebase/tests/          end-to-end test (emulators, Kids Games rules)
tests/                   unit tests (node --test)
tools/crosscheck.mjs     pinyin check against the Ministry of Education dictionary
tools/export-notes.mjs   writes the character and card notes of each level (notes-with-llm)
```

## Device storage keys

Shared with Kids Games (same website, same accounts): `kg-lock` (wrong-PIN counter) and `kg-lastPlayer` (last account picked). New KidsChinese-only keys start with `kc-` (none yet).
Firebase also keeps its sign-in and the Firestore copy in the browser's IndexedDB.

## Why spaced repetition and self-testing

- Spreading practice over days gives better long-term memory than the same practice in one block. See the meta-analysis by Cepeda et al. (2006), *Psychological Bulletin*: https://doi.org/10.1037/0033-2909.132.3.354
- Trying to recall an answer before seeing it (the "read it, then flip" step) gives better memory than reading the answer again. See Roediger & Karpicke (2006), *Psychological Science*: https://doi.org/10.1111/j.1467-9280.2006.01693.x

The exact intervals here (1, 3, 7, 14, 30 days) are a common default, not a tested optimum for children.

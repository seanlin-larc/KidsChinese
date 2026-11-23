# 學中文 Flash Cards (KidsChinese)

Flash cards for kids who learn Mandarin at Saturday school.
The card shows a word in **Traditional characters** (2–3 characters).
The child reads it, then flips the card to check the answer in **Zhuyin (注音)** and **Pinyin**.

It is a static web page. It has no server, no build step and no accounts.

## Features

- **13 topic decks, 186 words** (101 at level 1, 74 at level 2, 11 at level 3): family, greetings, animals, food, colours, body, school, weather & seasons, time, actions, places, transport, feelings.
- **3 levels**. Level 1 is for a beginner. Levels 2 and 3 add harder words.
- **Answer side in Taiwan textbook style**: Zhuyin runs vertically to the right of each character. Pinyin is below. The English meaning is optional.
- **Listen button**: the browser reads the word aloud. It uses a Taiwan Mandarin (zh-TW) voice when the device has one.
- **One player profile for each child**. Each child has separate progress, stars and a day streak.
- **Spaced repetition** (Leitner boxes). A card the child knows comes back after 1, 3, 7, 14, then 30 days. A missed card comes back later in the same round, and again the next day.
- **Rewards**: one star for each right answer, a bonus for a perfect round, a daily goal of 10 cards, and 0–3 stars for each deck.
- **Backup**: export and import progress as a JSON file.

## Run it on your computer

Any static file server works. With Python:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080. Opening `index.html` directly from disk does not work, because browsers block ES modules on `file://`.

## Put it online with GitHub Pages (free)

1. On GitHub, open **Settings → Pages**.
2. Set **Source** to *Deploy from a branch*.
3. Select branch `main` and folder `/ (root)`, then click **Save**.
4. After about a minute, the site is at `https://<your-user>.github.io/KidsChinese/`.

On an iPad or phone, use **Share → Add to Home Screen** to get an app icon.

## Important limits

- **Progress is saved only in that browser on that device** (`localStorage`). If each child uses a different tablet, that is fine. To move progress, use **Settings → Export** and then **Import** on the other device. Clearing browser data deletes progress.
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

`npm test` checks that every word has 2–3 Traditional characters, one valid pinyin syllable for each character, and a level. It also tests the Zhuyin converter and the review schedule.

`npm run crosscheck` compares your pinyin with the `pinyin-pro` dictionary. Lines marked `TW` are expected Taiwan readings. Lines marked `DIFF` need a person to check them.

## Project layout

```
index.html            page shell
css/style.css         styles (light and dark)
js/app.js             screens and buttons
js/data/words.js      the word decks
js/pinyin.js          pinyin → Zhuyin and tone marks
js/srs.js             spaced-repetition schedule, stars, streaks
js/storage.js         save, load, export, import
js/speech.js          read-aloud
tests/                unit tests (node --test)
tools/crosscheck.mjs  pinyin dictionary cross-check
```

## Why spaced repetition and self-testing

- Spreading practice over days gives better long-term memory than the same practice in one block. See the meta-analysis by Cepeda et al. (2006), *Psychological Bulletin*: https://doi.org/10.1037/0033-2909.132.3.354
- Trying to recall an answer before seeing it (the "read it, then flip" step) gives better memory than reading the answer again. See Roediger & Karpicke (2006), *Psychological Science*: https://doi.org/10.1111/j.1467-9280.2006.01693.x

The exact intervals here (1, 3, 7, 14, 30 days) are a common default, not a tested optimum for children.

// Writes the word-list notes for the notes-with-llm repo, from js/data/words.js and js/data/levels.js.
// For each level, two notes (English and Traditional Chinese):
//   level-<n>-<name>_characters.md   the characters that are new at this level, each one once
//   level-<n>-<name>_cards.md        every card of this level: word, Zhuyin, Pinyin, English, deck
//
// Usage: node tools/export-notes.mjs <folder>
// Example: node tools/export-notes.mjs ../notes-with-llm/projects/kidsChinese/words
// Run it again after a word change. Do not edit the written notes by hand.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { DECKS } from '../js/data/words.js';
import { LEVELS, CHARS, NOT_REQUIRED } from '../js/data/levels.js';
import { syllables, toZhuyinParts, toToneMarked } from '../js/pinyin.js';

const out = process.argv[2];
if (!out) {
  console.error('Usage: node tools/export-notes.mjs <folder>');
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const TONE = { 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' };
const zhuyin = (p) => syllables(p).map((s) => {
  const { symbols, tone } = toZhuyinParts(s);
  return tone === 5 ? '˙' + symbols : symbols + (TONE[tone] ?? '');
}).join(' ');
const pinyin = (p) => syllables(p).map(toToneMarked).join(' ');
const cell = (s) => String(s).replace(/\|/g, '\\|');
const slug = (l) => `level-${l.lv}-${l.en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const allWords = DECKS.flatMap((d) => d.words.map((w) => ({ ...w, deck: d })));
// The characters that some card of level <= lv uses.
const usedUpTo = (lv) => new Set(allWords.filter((w) => w.lv <= lv).flatMap((w) => [...w.w]));

const TEXT = {
  en: {
    suffix: '',
    charsTitle: (l) => `KidsChinese — ${l.zh} ${l.en} (level ${l.lv}): characters`,
    cardsTitle: (l) => `KidsChinese — ${l.zh} ${l.en} (level ${l.lv}): flash cards`,
    generated: 'Made by `tools/export-notes.mjs` in the KidsChinese repo. Do not edit by hand: run the tool again after a word change.',
    other: 'Traditional Chinese version',
    charsIntro: (l, from, to) => `Level ${l.lv} adds characters ${from}–${to} of the Ministry of Education frequency list (教育部字庫 5021 字). ` +
      `Each character is listed once. The levels below have the other characters; a card at this level can use them too.`,
    count: (n, used) => `Characters: ${n}. On a card at this level or below: ${used}. Not yet on a card: ${n - used}.`,
    notRequired: (cs) => `${cs} ${cs.length === 1 ? 'is a variant form' : 'are variant forms'} (異體字). The cards use the standard form, so ${cs.length === 1 ? 'it is' : 'they are'} not required.`,
    seeCards: 'Cards', seeChars: 'Characters', range: 'Characters',
    notYet: 'Not yet on a card',
    cardsIntro: (l, n) => `All ${n} cards whose level is ${l.lv}: the lowest level that has all the characters of the word. ` +
      `The cards of the levels below are in their own notes. The app shows a level's cards plus the cards of the levels below.`,
    cols: ['Word', 'Zhuyin', 'Pinyin', 'English', 'Note'],
    tw: '臺灣讀音 Taiwan reading',
    deck: (d, n) => `${d.name} ${d.en} (${n})`,
    none: 'No cards at this level yet.',
  },
  zh: {
    suffix: '_zhtw',
    charsTitle: (l) => `KidsChinese — ${l.zh}（第 ${l.lv} 級）：字表`,
    cardsTitle: (l) => `KidsChinese — ${l.zh}（第 ${l.lv} 級）：字卡`,
    generated: '由 KidsChinese repo 的 `tools/export-notes.mjs` 產生。請勿手動修改：修改詞語後再執行一次這個工具。',
    other: 'English version',
    charsIntro: (l, from, to) => `第 ${l.lv} 級新增教育部字頻表（教育部字庫 5021 字）的第 ${from}–${to} 字。` +
      `每個字只列一次。其他字在較低的程度；這一級的字卡也可以使用那些字。`,
    count: (n, used) => `字數：${n}。已用在這一級或較低程度的字卡上：${used}。還沒用在字卡上：${n - used}。`,
    notRequired: (cs) => `${cs} 是異體字。字卡使用正字，所以不必用到。`,
    seeCards: '字卡', seeChars: '字表', range: '第',
    notYet: '還沒用在字卡上的字',
    cardsIntro: (l, n) => `程度為第 ${l.lv} 級的全部 ${n} 張字卡：包含這個詞所有字的最低程度。` +
      `較低程度的字卡在各自的筆記裡。程式會顯示這一級的字卡，加上較低程度的字卡。`,
    cols: ['詞', '注音', '拼音', '英文', '備註'],
    tw: '臺灣讀音',
    deck: (d, n) => `${d.name}（${n}）`,
    none: '這一級還沒有字卡。',
  },
};

const files = [];
LEVELS.forEach((l, i) => {
  const from = i === 0 ? 1 : LEVELS[i - 1].size + 1;
  // Each character once, with its rank (position in the list). A repeated character keeps its first rank.
  const seen = new Set([...CHARS.slice(0, from - 1)]);
  const ranked = [];
  [...CHARS.slice(from - 1, l.size)].forEach((c, k) => { if (!seen.has(c)) { seen.add(c); ranked.push([c, from + k]); } });
  const chars = ranked.map(([c]) => c);
  const used = usedUpTo(l.lv);
  const unused = chars.filter((c) => !used.has(c) && !NOT_REQUIRED.includes(c));
  const notReq = chars.filter((c) => NOT_REQUIRED.includes(c)).join('');
  const cards = allWords.filter((w) => w.lv === l.lv);

  for (const T of Object.values(TEXT)) {
    const base = slug(l);
    const otherSuffix = T.suffix ? '' : '_zhtw';

    // Characters note: rows of 20, with the rank of the first character.
    const rows = [];
    for (let k = 0; k < chars.length; k += 20) {
      const row = ranked.slice(k, k + 20);
      rows.push(`- ${row[0][1]}–${row[row.length - 1][1]}：${row.map(([c]) => c).join('')}`);
    }
    const charsMd = [
      '---', `title: ${T.charsTitle(l)}`, `updated: ${today}`, 'authors: [Sean, Claude]', 'tags: [kidschinese, characters, levels]', '---', '',
      `# ${T.charsTitle(l)}`, '',
      `> ${T.generated}`, `> ${T.other}: [${base}_characters${otherSuffix}.md](${base}_characters${otherSuffix}.md)`, '',
      T.charsIntro(l, from, l.size), '',
      `- ${T.count(chars.length - notReq.length, chars.length - notReq.length - unused.length)}`,
      ...(notReq ? [`- ${T.notRequired(notReq)}`] : []),
      `- ${T.seeCards}: [${base}_cards${T.suffix}.md](${base}_cards${T.suffix}.md)`, '',
      ...rows, '',
      ...(unused.length ? [`## ${T.notYet} (${unused.length})`, '', unused.join(''), ''] : []),
    ].join('\n');

    // Cards note: one table for each deck.
    const byDeck = DECKS.map((d) => [d, cards.filter((w) => w.deck === d)]).filter(([, ws]) => ws.length);
    const cardsMd = [
      '---', `title: ${T.cardsTitle(l)}`, `updated: ${today}`, 'authors: [Sean, Claude]', 'tags: [kidschinese, flash-cards, levels]', '---', '',
      `# ${T.cardsTitle(l)}`, '',
      `> ${T.generated}`, `> ${T.other}: [${base}_cards${otherSuffix}.md](${base}_cards${otherSuffix}.md)`, '',
      T.cardsIntro(l, cards.length), '',
      `- ${T.seeChars}: [${base}_characters${T.suffix}.md](${base}_characters${T.suffix}.md)`, '',
      ...(byDeck.length ? [] : [T.none, '']),
      ...byDeck.flatMap(([d, ws]) => [
        `## ${T.deck(d, ws.length)}`, '',
        `| ${T.cols.join(' | ')} |`, `|${T.cols.map(() => '---').join('|')}|`,
        ...ws.map((w) => `| ${w.w} | ${zhuyin(w.p)} | ${pinyin(w.p)} | ${cell(w.en)} | ${w.tw ? T.tw : ''} |`),
        '',
      ]),
    ].join('\n');

    for (const [name, md] of [[`${base}_characters${T.suffix}.md`, charsMd], [`${base}_cards${T.suffix}.md`, cardsMd]]) {
      writeFileSync(path.join(out, name), md);
      files.push(name);
    }
  }
});
console.log(`Wrote ${files.length} notes to ${out}:\n  ${files.join('\n  ')}`);

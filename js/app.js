import { DECKS, cardId } from './data/words.js';
import { syllables, toZhuyinParts, toToneMarked } from './pinyin.js';
import * as srs from './srs.js';
import * as store from './storage.js';
import { speak, canSpeak, hasMandarinVoice } from './speech.js';

const DAILY_GOAL = 10;
const PERFECT_BONUS = 3;
const AVATARS = ['🐼', '🐯', '🐰', '🐶', '🐱', '🦊', '🐨', '🐸', '🦄', '🐲', '🐧', '🦁'];
const LEVELS = [
  { lv: 1, zh: '初級', en: 'Beginner', hint: 'Basic everyday words' },
  { lv: 2, zh: '中級', en: 'Intermediate', hint: 'Adds school, places and harder words' },
  { lv: 3, zh: '高級', en: 'Advanced', hint: 'All words' },
];

const app = document.getElementById('app');
let data = store.load();
let view = { name: data.activeId ? 'home' : 'profiles' };

// ---------- helpers ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function profile() {
  return data.profiles.find((p) => p.id === data.activeId) ?? null;
}

function persist() {
  if (!store.save(data)) toast('Could not save progress in this browser.');
}

function cardsFor(deck, maxLevel) {
  return deck.words
    .filter((w) => w.lv <= maxLevel)
    .map((w) => ({ ...w, id: cardId(deck.id, w), deckId: deck.id }));
}

function allCards(maxLevel) {
  return DECKS.flatMap((d) => cardsFor(d, maxLevel));
}

function dailyCount(p) {
  return p.daily.date === srs.today() ? p.daily.count : 0;
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function go(next) {
  view = next;
  render();
  window.scrollTo(0, 0);
}

// ---------- word rendering ----------

function zhuyinHtml(syl) {
  const { symbols, tone } = toZhuyinParts(syl);
  const sym = [...symbols].map((c) => `<span>${c}</span>`).join('');
  const toneMark = { 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' }[tone];
  return `<span class="zy" aria-hidden="true">${tone === 5 ? '<span class="zy-neutral">˙</span>' : ''}<span class="zy-col">${sym}</span>${toneMark ? `<span class="zy-tone">${toneMark}</span>` : ''}</span>`;
}

function answerHtml(card, settings) {
  const chars = [...card.w];
  const syls = syllables(card.p);
  const cells = chars.map((ch, i) => `
    <div class="cell">
      <div class="char-zy"><span class="hz">${ch}</span>${zhuyinHtml(syls[i])}</div>
      ${settings.showPinyin ? `<div class="py">${toToneMarked(syls[i])}</div>` : ''}
    </div>`).join('');
  const zyText = syls.map((s) => {
    const { symbols, tone } = toZhuyinParts(s);
    return tone === 5 ? '˙' + symbols : symbols + ({ 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' }[tone] ?? '');
  }).join(' ');
  const pyText = syls.map(toToneMarked).join(' ');
  return `
    <div class="answer" aria-label="${esc(card.w)}: ${esc(zyText)}, ${esc(pyText)}">${cells}</div>
    ${settings.showEnglish ? `<div class="en">${esc(card.en)}</div>` : ''}
    ${card.tw ? `<div class="tw-note" title="${esc(card.tw)}">臺灣讀音 · Taiwan reading</div>` : ''}`;
}

// ---------- screens ----------

function renderProfiles() {
  const list = data.profiles.map((p) => `
    <button class="profile-btn" data-action="pick" data-id="${p.id}">
      <span class="avatar">${esc(p.avatar)}</span>
      <span class="pname">${esc(p.name)}</span>
      <span class="pmeta">⭐ ${p.stars} · 🔥 ${srs.currentStreak(p.streak, srs.today())}</span>
    </button>`).join('');
  return `
    <header class="top center">
      <h1 class="logo">學中文 <span>Flash Cards</span></h1>
    </header>
    <main class="wrap">
      <h2 class="section-title">誰要練習？ Who is playing?</h2>
      <div class="profile-grid">
        ${list}
        <button class="profile-btn add" data-action="new-profile">
          <span class="avatar">＋</span><span class="pname">Add player</span>
        </button>
      </div>
      ${data.profiles.length ? '' : '<p class="muted center">Make one player for each child. Progress is saved separately.</p>'}
    </main>`;
}

function renderNewProfile() {
  const editing = view.editId ? data.profiles.find((p) => p.id === view.editId) : null;
  const avatar = view.avatar ?? editing?.avatar ?? AVATARS[0];
  const level = view.level ?? editing?.settings.maxLevel ?? 1;
  return `
    <header class="top"><button class="icon-btn" data-action="back" aria-label="Back">←</button><h1>${editing ? 'Edit player' : 'New player'}</h1></header>
    <main class="wrap narrow">
      <form id="profile-form" class="panel">
        <label class="field"><span>Name 名字</span>
          <input name="name" required maxlength="20" autocomplete="off" value="${esc(editing?.name ?? '')}" placeholder="e.g. 小明">
        </label>
        <fieldset class="field"><legend>Pick an animal</legend>
          <div class="avatar-grid">
            ${AVATARS.map((a) => `<button type="button" class="avatar-pick ${a === avatar ? 'on' : ''}" data-action="avatar" data-value="${a}" aria-pressed="${a === avatar}">${a}</button>`).join('')}
          </div>
        </fieldset>
        <fieldset class="field"><legend>Level 程度</legend>
          ${LEVELS.map((l) => `
            <label class="level-opt ${l.lv === level ? 'on' : ''}">
              <input type="radio" name="level" value="${l.lv}" ${l.lv === level ? 'checked' : ''} data-action="level">
              <span><b>${l.zh} ${l.en}</b><small>${l.hint} · ${allCards(l.lv).length} words</small></span>
            </label>`).join('')}
        </fieldset>
        <button class="btn primary big" type="submit">${editing ? 'Save' : 'Start 開始'}</button>
      </form>
    </main>`;
}

function renderHome() {
  const p = profile();
  const date = srs.today();
  const cards = allCards(p.settings.maxLevel);
  const dueAll = cards.filter((c) => srs.isDue(p.progress[c.id], date)).length;
  const mastered = cards.filter((c) => srs.isMastered(p.progress[c.id])).length;
  const done = dailyCount(p);
  const pct = Math.min(100, Math.round((100 * done) / DAILY_GOAL));

  const decks = DECKS.map((d) => {
    const dc = cardsFor(d, p.settings.maxLevel);
    if (!dc.length) return '';
    const stars = srs.deckStars(dc, p.progress);
    const due = dc.filter((c) => srs.isDue(p.progress[c.id], date)).length;
    const fresh = dc.filter((c) => !p.progress[c.id] || p.progress[c.id].box === 0).length;
    const m = dc.filter((c) => srs.isMastered(p.progress[c.id])).length;
    return `
      <button class="deck" data-action="study" data-deck="${d.id}">
        <span class="deck-icon">${d.icon}</span>
        <span class="deck-name">${d.name}</span>
        <span class="deck-en">${d.en}</span>
        <span class="deck-stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
        <span class="deck-meta">${m}/${dc.length} learned</span>
        ${due ? `<span class="badge due">${due} to review</span>` : fresh ? `<span class="badge new">${fresh} new</span>` : ''}
      </button>`;
  }).join('');

  return `
    <header class="top">
      <button class="who" data-action="switch" aria-label="Switch player"><span class="avatar sm">${esc(p.avatar)}</span>${esc(p.name)}</button>
      <div class="stats">
        <span class="stat" title="Day streak">🔥 ${srs.currentStreak(p.streak, date)}</span>
        <span class="stat" title="Stars">⭐ ${p.stars}</span>
        <button class="icon-btn" data-action="settings" aria-label="Settings">⚙️</button>
      </div>
    </header>
    <main class="wrap">
      <section class="panel today">
        <div>
          <h2>今天 Today</h2>
          <p class="muted">${done} / ${DAILY_GOAL} cards · ${mastered} of ${cards.length} words learned</p>
          <div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct}%"></div></div>
        </div>
        <button class="btn primary" data-action="study" data-deck="__due" ${dueAll ? '' : 'disabled'}>
          ${dueAll ? `複習 Review ${dueAll}` : 'Nothing to review ✓'}
        </button>
      </section>
      <h2 class="section-title">選一組 Pick a deck</h2>
      <div class="deck-grid">
        <button class="deck mix" data-action="study" data-deck="__mix">
          <span class="deck-icon">🎲</span><span class="deck-name">綜合</span><span class="deck-en">Mix of all decks</span>
        </button>
        ${decks}
      </div>
    </main>`;
}

function startSession(deckKey) {
  const p = profile();
  const date = srs.today();
  const size = p.settings.sessionSize;
  let pool;
  let title;
  if (deckKey === '__due') {
    pool = allCards(p.settings.maxLevel).filter((c) => srs.isDue(p.progress[c.id], date));
    title = '複習 Review';
  } else if (deckKey === '__mix') {
    pool = shuffle(allCards(p.settings.maxLevel));
    title = '綜合 Mix';
  } else {
    const deck = DECKS.find((d) => d.id === deckKey);
    pool = cardsFor(deck, p.settings.maxLevel);
    title = `${deck.icon} ${deck.name} ${deck.en}`;
  }
  const picked = srs.pickSession(pool, p.progress, date, size);
  go({
    name: 'study', deckKey, title, extra: picked.extra,
    queue: shuffle(picked.cards), index: 0, flipped: false,
    retried: new Set(), firstTry: new Map(), starsEarned: 0,
  });
  if (picked.extra) toast('All caught up! Extra practice — this will not change your schedule.');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderStudy() {
  const p = profile();
  const card = view.queue[view.index];
  const total = view.queue.length;
  const pct = Math.round((100 * view.index) / total);
  const voiceOk = canSpeak();
  return `
    <header class="top">
      <button class="icon-btn" data-action="quit" aria-label="Stop">✕</button>
      <h1 class="study-title">${esc(view.title)}</h1>
      <span class="stat">${view.index + 1}/${total}</span>
    </header>
    <div class="bar thin"><div style="width:${pct}%"></div></div>
    <main class="wrap study">
      <div class="card-scene">
        <button class="card ${view.flipped ? 'flipped' : ''}" data-action="flip" aria-label="${view.flipped ? 'Answer shown' : 'Tap to see the answer'}">
          <div class="face front">
            <div class="hz-front ${card.w.length === 3 ? 'three' : ''}">${card.w}</div>
            <div class="hint">讀讀看 · Read it, then tap</div>
          </div>
          <div class="face back">${view.flipped ? answerHtml(card, p.settings) : ''}</div>
        </button>
      </div>
      <div class="controls">
        ${view.flipped ? `
          ${voiceOk ? `<button class="btn ghost" data-action="speak">🔊 聽 Listen</button>` : ''}
          <div class="grade">
            <button class="btn miss big" data-action="grade" data-got="0">再練習<small>Not yet</small></button>
            <button class="btn hit big" data-action="grade" data-got="1">我會了<small>Got it!</small></button>
          </div>` : `
          <button class="btn primary big" data-action="flip">翻牌 Flip</button>`}
      </div>
    </main>`;
}

function grade(gotIt) {
  const p = profile();
  const date = srs.today();
  const card = view.queue[view.index];
  const isRetry = view.retried.has(card.id) && view.firstTry.has(card.id);

  p.progress[card.id] = srs.review(p.progress[card.id], gotIt, date, { extra: view.extra, retry: isRetry });
  if (!view.firstTry.has(card.id)) view.firstTry.set(card.id, gotIt);
  if (gotIt) { p.stars += 1; view.starsEarned += 1; }

  p.daily = { date, count: dailyCount(p) + 1 };
  p.streak = srs.updateStreak(p.streak, date);

  // A missed card comes back once at the end of this session.
  if (!gotIt && !view.retried.has(card.id)) {
    view.retried.add(card.id);
    view.queue.push(card);
  }
  persist();

  if (view.index + 1 >= view.queue.length) {
    const right = [...view.firstTry.values()].filter(Boolean).length;
    const count = view.firstTry.size;
    let bonus = 0;
    if (count >= 5 && right === count) { bonus = PERFECT_BONUS; p.stars += bonus; persist(); }
    go({ name: 'done', right, count, stars: view.starsEarned + bonus, bonus, deckKey: view.deckKey });
  } else {
    view.index += 1;
    view.flipped = false;
    render();
  }
}

function renderDone() {
  const p = profile();
  const { right, count, stars, bonus } = view;
  const ratio = count ? right / count : 0;
  const cheer = ratio === 1 ? '太棒了！ Amazing!' : ratio >= 0.7 ? '很好！ Great job!' : '加油！ Keep going!';
  return `
    <main class="wrap narrow done">
      <div class="panel center">
        <div class="big-emoji">${ratio === 1 ? '🏆' : ratio >= 0.7 ? '🎉' : '💪'}</div>
        <h1>${cheer}</h1>
        <p class="score">${right} / ${count} right the first time</p>
        <p class="earned">+${stars} ⭐ ${bonus ? `<small>(includes +${bonus} perfect bonus)</small>` : ''}</p>
        <p class="muted">🔥 ${srs.currentStreak(p.streak, srs.today())} day streak · ${dailyCount(p)} / ${DAILY_GOAL} cards today</p>
        <div class="row">
          <button class="btn ghost big" data-action="home">回家 Home</button>
          <button class="btn primary big" data-action="study" data-deck="${view.deckKey === '__due' ? '__mix' : view.deckKey}">再一次 Again</button>
        </div>
      </div>
    </main>`;
}

function renderSettings() {
  const p = profile();
  const s = p.settings;
  const voiceNote = !canSpeak()
    ? 'This browser cannot read words aloud.'
    : hasMandarinVoice() ? 'A Mandarin voice is available.' : 'No Mandarin voice found on this device. Add one in system settings (Chinese, Taiwan).';
  return `
    <header class="top"><button class="icon-btn" data-action="home" aria-label="Back">←</button><h1>設定 Settings · ${esc(p.name)}</h1></header>
    <main class="wrap narrow">
      <form id="settings-form" class="panel">
        <fieldset class="field"><legend>Level 程度</legend>
          <select name="maxLevel">
            ${LEVELS.map((l) => `<option value="${l.lv}" ${s.maxLevel === l.lv ? 'selected' : ''}>${l.zh} ${l.en} (${allCards(l.lv).length} words)</option>`).join('')}
          </select>
        </fieldset>
        <label class="check"><input type="checkbox" name="showPinyin" ${s.showPinyin ? 'checked' : ''}> Show Pinyin on the answer (Zhuyin is always shown)</label>
        <label class="check"><input type="checkbox" name="showEnglish" ${s.showEnglish ? 'checked' : ''}> Show English meaning on the answer</label>
        <label class="field"><span>Cards per round</span>
          <select name="sessionSize">${[5, 10, 15, 20].map((n) => `<option ${s.sessionSize === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Voice speed</span>
          <select name="speechRate">${[[0.6, 'Slow'], [0.8, 'Normal'], [1, 'Fast']].map(([v, t]) => `<option value="${v}" ${s.speechRate === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <small class="muted">${voiceNote}</small>
        </label>
        <button class="btn primary" type="submit">Save</button>
      </form>

      <section class="panel">
        <h2>Player</h2>
        <div class="row wrap-row">
          <button class="btn ghost" data-action="edit-profile">Edit name / animal</button>
          <button class="btn ghost" data-action="reset">Reset progress</button>
          <button class="btn danger" data-action="delete">Delete player</button>
        </div>
      </section>

      <section class="panel">
        <h2>Backup (all players)</h2>
        <p class="muted">Progress is saved only in this browser. Export a file to keep a backup or to move to another device.</p>
        <div class="row wrap-row">
          <button class="btn ghost" data-action="export">⬇️ Export</button>
          <label class="btn ghost">⬆️ Import<input type="file" accept="application/json,.json" id="import-file" hidden></label>
        </div>
      </section>
    </main>`;
}

function render() {
  if (view.name !== 'profiles' && view.name !== 'new-profile' && !profile()) view = { name: 'profiles' };
  const screens = { profiles: renderProfiles, 'new-profile': renderNewProfile, home: renderHome, study: renderStudy, done: renderDone, settings: renderSettings };
  app.innerHTML = screens[view.name]();
  app.dataset.screen = view.name;
}

// ---------- events ----------

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  const p = profile();
  switch (action) {
    case 'pick': data.activeId = el.dataset.id; persist(); go({ name: 'home' }); break;
    case 'new-profile': go({ name: 'new-profile' }); break;
    case 'edit-profile': go({ name: 'new-profile', editId: p.id }); break;
    case 'avatar': view.avatar = el.dataset.value; keepFormAndRender(); break;
    case 'back': go({ name: data.activeId && view.editId ? 'settings' : data.activeId ? 'home' : 'profiles' }); break;
    case 'switch': go({ name: 'profiles' }); break;
    case 'home': go({ name: 'home' }); break;
    case 'settings': go({ name: 'settings' }); break;
    case 'study': startSession(el.dataset.deck); break;
    case 'flip':
      if (!view.flipped) { view.flipped = true; render(); }
      break;
    case 'speak': speak(view.queue[view.index].w, p.settings.speechRate); break;
    case 'grade': grade(el.dataset.got === '1'); break;
    case 'quit': go({ name: 'home' }); break;
    case 'reset':
      if (confirm(`Reset all progress and stars for ${p.name}?`)) {
        Object.assign(p, { progress: {}, stars: 0, streak: { count: 0, last: null }, daily: { date: null, count: 0 } });
        persist(); toast('Progress reset.');
      }
      break;
    case 'delete':
      if (confirm(`Delete ${p.name}? This cannot be undone.`)) {
        data.profiles = data.profiles.filter((x) => x.id !== p.id);
        data.activeId = null; persist(); go({ name: 'profiles' });
      }
      break;
    case 'export': downloadBackup(); break;
  }
});

// Keep typed name when the avatar/level picker re-renders the form.
function keepFormAndRender() {
  const name = document.querySelector('#profile-form [name=name]')?.value;
  render();
  if (name !== undefined) document.querySelector('#profile-form [name=name]').value = name;
}

app.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'level') { view.level = Number(e.target.value); keepFormAndRender(); }
  if (e.target.id === 'import-file') importBackup(e.target.files[0]);
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  if (e.target.id === 'profile-form') {
    const name = String(form.get('name')).trim();
    if (!name) return;
    const avatar = view.avatar ?? AVATARS[0];
    const level = Number(form.get('level') ?? 1);
    const editing = view.editId ? data.profiles.find((p) => p.id === view.editId) : null;
    if (editing) {
      editing.name = name; editing.avatar = view.avatar ?? editing.avatar; editing.settings.maxLevel = level;
      persist(); go({ name: 'settings' });
    } else {
      const p = store.createProfile(name, avatar, level);
      data.profiles.push(p); data.activeId = p.id; persist(); go({ name: 'home' });
    }
  }
  if (e.target.id === 'settings-form') {
    const p = profile();
    p.settings = {
      ...p.settings,
      maxLevel: Number(form.get('maxLevel')),
      showPinyin: form.get('showPinyin') === 'on',
      showEnglish: form.get('showEnglish') === 'on',
      sessionSize: Number(form.get('sessionSize')),
      speechRate: Number(form.get('speechRate')),
    };
    persist(); toast('Saved ✓'); go({ name: 'home' });
  }
});

document.addEventListener('keydown', (e) => {
  if (view.name !== 'study' || e.target.matches('input, select, textarea')) return;
  if (!view.flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); view.flipped = true; render(); return; }
  if (view.flipped) {
    if (e.key === 'ArrowRight' || e.key === '2') grade(true);
    else if (e.key === 'ArrowLeft' || e.key === '1') grade(false);
    else if (e.key.toLowerCase() === 's') speak(view.queue[view.index].w, profile().settings.speechRate);
  }
});

function downloadBackup() {
  const blob = new Blob([store.exportJson(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `kidschinese-backup-${srs.today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importBackup(file) {
  if (!file) return;
  try {
    const imported = store.importJson(await file.text());
    if (!confirm(`Replace progress on this device with the backup (${imported.profiles.length} player(s))?`)) return;
    data = imported;
    if (!data.profiles.some((p) => p.id === data.activeId)) data.activeId = null;
    persist(); toast('Backup imported ✓'); go({ name: data.activeId ? 'home' : 'profiles' });
  } catch (err) {
    toast(err.message || 'Could not read that file.');
  }
}

render();

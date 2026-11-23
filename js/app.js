import { DECKS, cardId } from './data/words.js';
import { syllables, toZhuyinParts, toToneMarked } from './pinyin.js';
import * as srs from './srs.js';
import { speak, canSpeak, hasMandarinVoice } from './speech.js';
import { ACCOUNTS, LEARNERS, accountForCode } from './accounts.js';
import * as L from './lock.js';
import { access, loadAuth, withTimeout } from './load.js';
window.kcStarted = true;   // the page script started (see js/stuck.js)

const DAILY_GOAL = 10;
const PERFECT_BONUS = 3;
const PIN_LENGTH = 6;
const LAST_KEY = 'kc-lastAccount';   // the last account picked on this device
const AVATARS = ['🐼', '🐯', '🐰', '🐶', '🐱', '🦊', '🐨', '🐸', '🦄', '🐲', '🐧', '🦁'];
const DEFAULT_AVATAR = { YC: '🐯', JY: '🐼' };
const LEVELS = [
  { lv: 1, zh: '初級', en: 'Beginner', hint: 'Basic everyday words' },
  { lv: 2, zh: '中級', en: 'Intermediate', hint: 'Adds school, places and harder words' },
  { lv: 3, zh: '高級', en: 'Advanced', hint: 'All words' },
];
const WRONG_PIN = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'];

const app = document.getElementById('app');

// session: { auth, player: { uid, code, role } } after sign-in.
// me: the signed-in learner's data { code, level, prefs, summary, cards }.
// kids: for a parent, { YC: data, JY: data }.
let session = null;
let me = null;
let kids = {};
let view = { name: 'loading' };

// ---------- helpers ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cardsFor(deck, maxLevel) {
  return deck.words
    .filter((w) => w.lv <= maxLevel)
    .map((w) => ({ ...w, id: cardId(deck.id, w), deckId: deck.id }));
}

function allCards(maxLevel) {
  return DECKS.flatMap((d) => cardsFor(d, maxLevel));
}

function levelInfo(lv) {
  return LEVELS.find((l) => l.lv === lv) ?? LEVELS[0];
}

function withDefaults(code, data) {
  return {
    code,
    levelSet: data.level != null,
    level: data.level ?? 1,
    prefs: { showPinyin: true, showEnglish: true, sessionSize: 10, speechRate: 0.8, avatar: DEFAULT_AVATAR[code] ?? '🐼', ...(data.prefs ?? {}) },
    summary: {
      stars: 0, streak: { count: 0, last: null }, daily: { date: null, count: 0 }, ...(data.summary ?? {}),
    },
    cards: data.cards ?? {},
  };
}

function dailyCount(summary) {
  return summary.daily.date === srs.today() ? summary.daily.count : 0;
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function go(next) {
  view = next;
  render();
  window.scrollTo(0, 0);
}

function offline() {
  return navigator.onLine === false;
}

// A save that goes on in the background. Firestore keeps it on the device when offline.
function background(promise, what) {
  promise.catch((e) => {
    console.warn('[kidschinese] Save failed:', what, e);
    toast(e && e.code === 'permission-denied'
      ? `Could not save ${what}. Ask a parent to check the setup.`
      : `Could not save ${what}. Try again later.`);
  });
}

// ---------- start: who is signed in? ----------

async function boot() {
  go({ name: 'loading' });
  const st = await access();
  if (st.mode === 'not-configured') return go({ name: 'problem', kind: 'setup' });
  if (st.mode === 'offline') return go({ name: 'problem', kind: 'offline' });
  if (st.mode === 'signed-out') return go({ name: 'signin', selected: lastAccount(), pin: '' });
  session = { auth: st.auth, player: st.player };
  try {
    if (st.player.role === 'learner') {
      me = withDefaults(st.player.code, await withTimeout(st.auth.loadLearner(st.player.code), 15000));
      go({ name: 'home' });
    } else {
      await loadKids();
      go({ name: 'parent' });
    }
  } catch (e) {
    console.error('[kidschinese] Could not load progress:', e);
    go({ name: 'problem', kind: e && e.code === 'permission-denied' ? 'rules' : 'load' });
  }
}

async function loadKids() {
  const list = await withTimeout(Promise.all(LEARNERS.map((c) => session.auth.loadLearner(c))), 15000);
  kids = {};
  LEARNERS.forEach((c, i) => { kids[c] = withDefaults(c, list[i]); });
}

async function signOut() {
  try { if (session) await withTimeout(session.auth.signOutPlayer(), 5000); }
  catch (e) { console.warn('[kidschinese] Sign-out failed:', e); }
  session = null; me = null; kids = {};
  go({ name: 'signin', selected: lastAccount(), pin: '' });
}

function lastAccount() {
  try {
    const v = localStorage.getItem(LAST_KEY);
    return accountForCode(v) ? v : null;
  } catch { return null; }
}

// ---------- word rendering ----------

function zhuyinHtml(syl) {
  const { symbols, tone } = toZhuyinParts(syl);
  const sym = [...symbols].map((c) => `<span>${c}</span>`).join('');
  const toneMark = { 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' }[tone];
  return `<span class="zy" aria-hidden="true">${tone === 5 ? '<span class="zy-neutral">˙</span>' : ''}<span class="zy-col">${sym}</span>${toneMark ? `<span class="zy-tone">${toneMark}</span>` : ''}</span>`;
}

function answerHtml(card, prefs) {
  const chars = [...card.w];
  const syls = syllables(card.p);
  const cells = chars.map((ch, i) => `
    <div class="cell">
      <div class="char-zy"><span class="hz">${ch}</span>${zhuyinHtml(syls[i])}</div>
      ${prefs.showPinyin ? `<div class="py">${toToneMarked(syls[i])}</div>` : ''}
    </div>`).join('');
  const zyText = syls.map((s) => {
    const { symbols, tone } = toZhuyinParts(s);
    return tone === 5 ? '˙' + symbols : symbols + ({ 2: 'ˊ', 3: 'ˇ', 4: 'ˋ' }[tone] ?? '');
  }).join(' ');
  const pyText = syls.map(toToneMarked).join(' ');
  return `
    <div class="answer" aria-label="${esc(card.w)}: ${esc(zyText)}, ${esc(pyText)}">${cells}</div>
    ${prefs.showEnglish ? `<div class="en">${esc(card.en)}</div>` : ''}
    ${card.tw ? `<div class="tw-note" title="${esc(card.tw)}">臺灣讀音 · Taiwan reading</div>` : ''}`;
}

// ---------- screens: loading, problems ----------

function renderLoading() {
  return `<main class="wrap narrow center"><p id="loading" class="loading">載入中 Loading…</p></main>`;
}

function renderProblem() {
  const text = {
    setup: ['還沒設定 Not set up yet', 'KidsChinese is not connected to its Firebase project yet. A parent must finish the steps in firebase/SETUP.md.'],
    offline: ['沒有網路 No internet', 'The first sign-in on this device needs internet. Connect to Wi-Fi, then try again.'],
    rules: ['不能讀取 Cannot read progress', 'Firebase refused to read the progress. A parent must publish firebase/firestore.rules in the Firebase console (see firebase/SETUP.md).'],
    load: ['不能讀取 Cannot read progress', 'The progress did not load. Check the internet, then try again.'],
  }[view.kind];
  return `
    <header class="top center"><h1 class="logo">學中文 <span>Flash Cards</span></h1></header>
    <main class="wrap narrow">
      <div class="panel center">
        <h2>${text[0]}</h2>
        <p class="problem" role="alert">${text[1]}</p>
        <div class="row wrap-row center-row">
          <button class="btn primary" data-action="retry">再試一次 Try again</button>
          ${session ? '<button class="btn ghost" data-action="signout">Sign out</button>' : ''}
        </div>
      </div>
    </main>`;
}

// ---------- screen: sign-in ----------

function lockText(code) {
  const st = L.lockState(code);
  if (!st.locked) return null;
  const min = Math.max(1, Math.ceil((st.until - Date.now()) / 60000));
  return `${code} is locked for ${min} more minute${min === 1 ? '' : 's'} (${L.LOCK_FAILS} wrong PINs).`;
}

function signinMsg() {
  if (view.msg) return view.msg;
  if (!view.selected) return { text: '選你的名字 Pick your name, then type your PIN.' };
  const lt = lockText(view.selected);
  if (lt) return { text: lt, bad: true };
  return { text: `${view.selected}，請輸入密碼 Type your PIN.` };
}

function renderSignin() {
  const acct = (a) => {
    const on = view.selected === a.code;
    const icon = a.role === 'learner' ? (DEFAULT_AVATAR[a.code] ?? '🙂') : '🔑';
    return `<button type="button" class="acct ${a.role} ${on ? 'on' : ''}" role="radio" aria-checked="${on}" data-action="pick" data-code="${a.code}" ${view.busy ? 'disabled' : ''}>
      <span class="avatar ${a.role === 'parent' ? 'sm' : ''}">${icon}</span><span class="pname">${a.code}</span></button>`;
  };
  const msg = signinMsg();
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'clear', '0', 'back'].map((k) => {
    const label = k === 'clear' ? 'Clear' : k === 'back' ? '⌫' : k;
    const aria = k === 'clear' ? 'Clear PIN' : k === 'back' ? 'Delete last digit' : k;
    return `<button type="button" class="key ${k.length > 1 ? 'small' : ''}" data-action="key" data-key="${k}" aria-label="${aria}" ${view.busy ? 'disabled' : ''}>${label}</button>`;
  }).join('');
  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => `<span class="${i < view.pin.length ? 'on' : ''}"></span>`).join('');
  return `
    <header class="top center"><h1 class="logo">學中文 <span>Flash Cards</span></h1></header>
    <main class="wrap narrow">
      <section class="panel signin" aria-labelledby="signinTitle">
        <h2 id="signinTitle" class="center">誰要練習？ Who is playing?</h2>
        ${offline() ? '<p class="problem">No internet connection. Sign-in needs internet.</p>' : ''}
        <div class="accts" role="radiogroup" aria-label="Learner">${ACCOUNTS.filter((a) => a.role === 'learner').map(acct).join('')}</div>
        <div class="accts parents" role="radiogroup" aria-label="Parent"><span class="muted">家長 Parent</span>${ACCOUNTS.filter((a) => a.role === 'parent').map(acct).join('')}</div>
        <div class="dots ${view.shake ? 'shake' : ''}" aria-hidden="true">${dots}</div>
        <p class="msg ${msg.bad ? 'bad' : ''}" role="status" aria-live="polite">${esc(msg.text)}</p>
        <div class="pad">${keys}</div>
      </section>
    </main>`;
}

function pressKey(k) {
  if (view.busy) return;
  view.shake = false;
  if (k === 'clear') { view.pin = ''; view.msg = null; return render(); }
  if (k === 'back') { view.pin = view.pin.slice(0, -1); return render(); }
  if (!view.selected) { view.msg = { text: 'Pick your name first.', bad: true }; return render(); }
  if (lockText(view.selected)) { view.pin = ''; view.msg = null; return render(); }
  if (view.pin.length >= PIN_LENGTH) return;
  view.pin += k;
  view.msg = null;
  render();
  if (view.pin.length === PIN_LENGTH) submitPin();
}

async function submitPin() {
  const code = view.selected;
  const pin = view.pin;
  view.busy = true;
  view.msg = { text: 'Checking…' };
  render();
  let auth = null;
  try {
    auth = await loadAuth();
    if (!auth) throw Object.assign(new Error('no-firebase'), { code: 'auth/network-request-failed' });
    await withTimeout(auth.signIn(code, pin), 15000);
    L.recordSuccess(code);
    try { localStorage.setItem(LAST_KEY, code); } catch {}
    view.pin = '';
    return boot();
  } catch (e) {
    console.error('[kidschinese] Sign-in failed:', e && e.code, e);
    let text = signInError(e);
    if (e && WRONG_PIN.includes(e.code)) {
      const st = L.recordFail(code);
      text = st.locked ? lockText(code)
        : `Wrong PIN. ${st.left} ${st.left === 1 ? 'try' : 'tries'} left before a ${L.LOCK_MINUTES}-minute lock.`;
    }
    if (e && e.message === 'not-family' && auth) await auth.signOutPlayer().catch(() => {});
    Object.assign(view, { pin: '', busy: false, shake: true, msg: { text, bad: true } });
    render();
  }
}

function signInError(e) {
  const code = (e && e.code) || '';
  if (e && e.message === 'not-family') return 'This account is not set up yet.';
  if (code === 'auth/too-many-requests') return 'Too many tries. Wait a few minutes, then try again.';
  if (code === 'auth/network-request-failed' || code === 'app/timeout') return 'No internet connection. Sign-in needs internet.';
  return 'Sign-in did not work. Try again.';
}

// ---------- screen: learner home ----------

function signedInBar() {
  return `<footer class="signed-in">
    <span>Signed in as <b>${esc(session.player.code)}</b></span>
    ${offline() ? '<span class="off" title="Progress is saved on this device and sent when you are online.">⚠️ Offline · saved on this device</span>' : ''}
    <button class="btn ghost slim" data-action="signout">Sign out</button>
  </footer>`;
}

function renderHome() {
  const date = srs.today();
  const lvl = levelInfo(me.level);
  const cards = allCards(me.level);
  const dueAll = cards.filter((c) => srs.isDue(me.cards[c.id], date)).length;
  const mastered = cards.filter((c) => srs.isMastered(me.cards[c.id])).length;
  const done = dailyCount(me.summary);
  const pct = Math.min(100, Math.round((100 * done) / DAILY_GOAL));

  const decks = DECKS.map((d) => {
    const dc = cardsFor(d, me.level);
    if (!dc.length) return '';
    const stars = srs.deckStars(dc, me.cards);
    const due = dc.filter((c) => srs.isDue(me.cards[c.id], date)).length;
    const fresh = dc.filter((c) => !me.cards[c.id] || me.cards[c.id].box === 0).length;
    const m = dc.filter((c) => srs.isMastered(me.cards[c.id])).length;
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
      <span class="who"><span class="avatar sm">${esc(me.prefs.avatar)}</span>${esc(me.code)}</span>
      <div class="stats">
        ${offline() ? '<span class="stat off" title="No internet. Progress is saved on this device and sent later.">⚠️ Offline</span>' : ''}
        <span class="stat" title="Day streak">🔥 ${srs.currentStreak(me.summary.streak, date)}</span>
        <span class="stat" title="Stars">⭐ ${me.summary.stars}</span>
        <button class="icon-btn" data-action="settings" aria-label="Settings">⚙️</button>
      </div>
    </header>
    <main class="wrap">
      <section class="panel today">
        <div>
          <h2>今天 Today</h2>
          <p class="muted">${done} / ${DAILY_GOAL} cards · ${mastered} of ${cards.length} words learned · ${lvl.zh} ${lvl.en}</p>
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
    </main>
    ${signedInBar()}`;
}

// ---------- screens: study and done ----------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startSession(deckKey) {
  const date = srs.today();
  let pool;
  let title;
  if (deckKey === '__due') {
    pool = allCards(me.level).filter((c) => srs.isDue(me.cards[c.id], date));
    title = '複習 Review';
  } else if (deckKey === '__mix') {
    pool = shuffle(allCards(me.level));
    title = '綜合 Mix';
  } else {
    const deck = DECKS.find((d) => d.id === deckKey);
    pool = cardsFor(deck, me.level);
    title = `${deck.icon} ${deck.name} ${deck.en}`;
  }
  const picked = srs.pickSession(pool, me.cards, date, me.prefs.sessionSize);
  go({
    name: 'study', deckKey, title, extra: picked.extra,
    queue: shuffle(picked.cards), index: 0, flipped: false,
    retried: new Set(), firstTry: new Map(), starsEarned: 0,
  });
  if (picked.extra) toast('All caught up! Extra practice — this will not change your schedule.');
}

function renderStudy() {
  const card = view.queue[view.index];
  const total = view.queue.length;
  const pct = Math.round((100 * view.index) / total);
  return `
    <header class="top">
      <button class="icon-btn" data-action="home" aria-label="Stop">✕</button>
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
          <div class="face back">${view.flipped ? answerHtml(card, me.prefs) : ''}</div>
        </button>
      </div>
      <div class="controls">
        ${view.flipped ? `
          ${canSpeak() ? '<button class="btn ghost" data-action="speak">🔊 聽 Listen</button>' : ''}
          <div class="grade">
            <button class="btn miss big" data-action="grade" data-got="0">再練習<small>Not yet</small></button>
            <button class="btn hit big" data-action="grade" data-got="1">我會了<small>Got it!</small></button>
          </div>` : `
          <button class="btn primary big" data-action="flip">翻牌 Flip</button>`}
      </div>
    </main>`;
}

function grade(gotIt) {
  const date = srs.today();
  const card = view.queue[view.index];
  const isRetry = view.retried.has(card.id) && view.firstTry.has(card.id);

  const state = srs.review(me.cards[card.id], gotIt, date, { extra: view.extra, retry: isRetry });
  me.cards[card.id] = state;
  if (!view.firstTry.has(card.id)) view.firstTry.set(card.id, gotIt);
  const s = me.summary;
  if (gotIt) { s.stars += 1; view.starsEarned += 1; }
  s.daily = { date, count: dailyCount(s) + 1 };
  s.streak = srs.updateStreak(s.streak, date);

  // A missed card comes back once at the end of this round.
  if (!gotIt && !view.retried.has(card.id)) {
    view.retried.add(card.id);
    view.queue.push(card);
  }

  const last = view.index + 1 >= view.queue.length;
  let bonus = 0;
  const right = [...view.firstTry.values()].filter(Boolean).length;
  const count = view.firstTry.size;
  if (last && count >= 5 && right === count) { bonus = PERFECT_BONUS; s.stars += bonus; }

  background(session.auth.saveAnswer(me.code, card.id, state, s), 'your progress');

  if (last) {
    go({ name: 'done', right, count, stars: view.starsEarned + bonus, bonus, deckKey: view.deckKey });
  } else {
    view.index += 1;
    view.flipped = false;
    render();
  }
}

function renderDone() {
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
        <p class="muted">🔥 ${srs.currentStreak(me.summary.streak, srs.today())} day streak · ${dailyCount(me.summary)} / ${DAILY_GOAL} cards today</p>
        <div class="row">
          <button class="btn ghost big" data-action="home">回家 Home</button>
          <button class="btn primary big" data-action="study" data-deck="${view.deckKey === '__due' ? '__mix' : view.deckKey}">再一次 Again</button>
        </div>
      </div>
    </main>`;
}

// ---------- screen: learner settings ----------

function renderSettings() {
  const p = me.prefs;
  const lvl = levelInfo(me.level);
  const avatar = view.avatar ?? p.avatar;
  const voiceNote = !canSpeak()
    ? 'This browser cannot read words aloud.'
    : hasMandarinVoice() ? 'A Mandarin voice is available.' : 'No Mandarin voice found on this device. Add one in system settings (Chinese, Taiwan).';
  return `
    <header class="top"><button class="icon-btn" data-action="home" aria-label="Back">←</button><h1>設定 Settings · ${esc(me.code)}</h1></header>
    <main class="wrap narrow">
      <form id="settings-form" class="panel">
        <div class="field"><span>Level 程度</span>
          <p class="readonly">${lvl.zh} ${lvl.en} · ${allCards(me.level).length} words <small class="muted">— a parent sets the level</small></p>
        </div>
        <fieldset class="field"><legend>Pick an animal</legend>
          <div class="avatar-grid">
            ${AVATARS.map((a) => `<button type="button" class="avatar-pick ${a === avatar ? 'on' : ''}" data-action="avatar" data-value="${a}" aria-pressed="${a === avatar}">${a}</button>`).join('')}
          </div>
        </fieldset>
        <label class="check"><input type="checkbox" name="showPinyin" ${p.showPinyin ? 'checked' : ''}> Show Pinyin on the answer (Zhuyin is always shown)</label>
        <label class="check"><input type="checkbox" name="showEnglish" ${p.showEnglish ? 'checked' : ''}> Show English meaning on the answer</label>
        <label class="field"><span>Cards per round</span>
          <select name="sessionSize">${[5, 10, 15, 20].map((n) => `<option ${p.sessionSize === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Voice speed</span>
          <select name="speechRate">${[[0.6, 'Slow'], [0.8, 'Normal'], [1, 'Fast']].map(([v, t]) => `<option value="${v}" ${p.speechRate === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <small class="muted">${voiceNote}</small>
        </label>
        <button class="btn primary" type="submit">Save</button>
      </form>
      <section class="panel">
        <h2>Account</h2>
        <p class="muted">Signed in as <b>${esc(me.code)}</b>. Sign out before someone else plays on this device.</p>
        <button class="btn ghost" data-action="signout">Sign out</button>
      </section>
    </main>`;
}

// ---------- screen: parent page ----------

function kidPanel(k) {
  const date = srs.today();
  const lvl = levelInfo(k.level);
  const cards = allCards(k.level);
  const mastered = cards.filter((c) => srs.isMastered(k.cards[c.id])).length;
  const started = cards.filter((c) => k.cards[c.id] && k.cards[c.id].box > 0).length;
  const due = cards.filter((c) => srs.isDue(k.cards[c.id], date)).length;
  const lastDay = k.summary.streak.last;
  const words = new Map(allCards(3).map((c) => [c.id, c]));
  const hard = Object.entries(k.cards)
    .map(([id, s]) => ({ c: words.get(id), miss: (s.seen || 0) - (s.right || 0), box: s.box }))
    .filter((x) => x.c && x.miss > 0)
    .sort((a, b) => b.miss - a.miss || a.box - b.box)
    .slice(0, 10);
  const rows = DECKS.map((d) => {
    const dc = cardsFor(d, k.level);
    if (!dc.length) return '';
    const m = dc.filter((c) => srs.isMastered(k.cards[c.id])).length;
    const pct = Math.round((100 * m) / dc.length);
    return `<tr><td>${d.icon} ${d.name} <small class="muted">${d.en}</small></td><td class="num">${m}/${dc.length}</td>
      <td class="bar-cell"><div class="bar"><div style="width:${pct}%"></div></div></td></tr>`;
  }).join('');
  return `
    <section class="panel kid" aria-labelledby="kid-${k.code}">
      <div class="kid-head">
        <h2 id="kid-${k.code}"><span class="avatar sm">${esc(k.prefs.avatar)}</span> ${k.code}</h2>
        <label class="level-pick">程度 Level
          <select data-action="set-level" data-code="${k.code}" aria-label="Level for ${k.code}">
            ${LEVELS.map((l) => `<option value="${l.lv}" ${k.level === l.lv ? 'selected' : ''}>${l.zh} ${l.en} (${allCards(l.lv).length})</option>`).join('')}
          </select>
        </label>
      </div>
      ${k.levelSet ? '' : '<p class="note">Level not set yet. The app uses 初級 Beginner until you choose one.</p>'}
      <div class="kpis">
        <div><b>${mastered}</b><span>of ${cards.length} learned</span></div>
        <div><b>${started}</b><span>started</span></div>
        <div><b>${due}</b><span>to review now</span></div>
        <div><b>⭐ ${k.summary.stars}</b><span>stars</span></div>
        <div><b>🔥 ${srs.currentStreak(k.summary.streak, date)}</b><span>day streak</span></div>
        <div><b>${dailyCount(k.summary)}</b><span>cards today</span></div>
      </div>
      <p class="muted">Last practice: ${lastDay ? esc(lastDay) : 'never'} · Level: ${lvl.zh} ${lvl.en}</p>
      <details>
        <summary>Progress by deck</summary>
        <table class="decks"><tbody>${rows}</tbody></table>
      </details>
      <details ${hard.length ? '' : 'hidden'}>
        <summary>Words to practise (most "Not yet")</summary>
        <ul class="hard">${hard.map((x) => `<li><span class="hz-sm">${x.c.w}</span> ${esc(syllables(x.c.p).map(toToneMarked).join(' '))} <small class="muted">${esc(x.c.en)} · ${x.miss}×</small></li>`).join('')}</ul>
      </details>
      <div class="row wrap-row">
        <button class="btn danger" data-action="reset" data-code="${k.code}">Reset progress</button>
      </div>
    </section>`;
}

function renderParent() {
  return `
    <header class="top">
      <span class="who"><span class="avatar sm">🔑</span>家長 Parent · ${esc(session.player.code)}</span>
      <button class="icon-btn" data-action="refresh" aria-label="Refresh">↻</button>
    </header>
    <main class="wrap">
      <p class="muted">Only parents see this page. Kids cannot change their level or reset progress.
        A word counts as <b>learned</b> after the child gets it right on 3 separate review days (1, then 3 days later).
        <b>Started</b> = practised at least once.</p>
      <div class="kids">${LEARNERS.map((c) => kidPanel(kids[c])).join('')}</div>
    </main>
    ${signedInBar()}`;
}

async function setLevel(code, level) {
  const k = kids[code];
  const before = k.level;
  k.level = level;
  k.levelSet = true;
  render();
  try {
    await withTimeout(session.auth.setLevel(code, level), offline() ? 2000 : 15000);
    toast(`${code}: level set to ${levelInfo(level).zh} ${levelInfo(level).en} ✓`);
  } catch (e) {
    if (e && e.code === 'app/timeout') { toast(`${code}: level saved on this device. It is sent when you are online.`); return; }
    console.error('[kidschinese] setLevel failed:', e);
    k.level = before;
    render();
    toast(`Could not set the level (${e && e.code ? e.code : 'error'}).`);
  }
}

async function resetKid(code) {
  if (offline()) { toast('Reset needs internet.'); return; }
  if (!confirm(`Reset all progress and stars for ${code}? This cannot be undone.\n\nThe level and settings stay.`)) return;
  try {
    const n = await withTimeout(session.auth.resetProgress(code), 30000);
    await loadKids();
    render();
    toast(`${code}: progress reset (${n} cards cleared).`);
  } catch (e) {
    console.error('[kidschinese] reset failed:', e);
    toast(`Could not reset (${e && e.code ? e.code : 'error'}). Try again.`);
  }
}

// ---------- render and events ----------

function render() {
  const screens = {
    loading: renderLoading, problem: renderProblem, signin: renderSignin,
    home: renderHome, study: renderStudy, done: renderDone, settings: renderSettings, parent: renderParent,
  };
  app.innerHTML = screens[view.name]();
  app.dataset.screen = view.name;
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const action = el.dataset.action;
  switch (action) {
    case 'retry': boot(); break;
    case 'signout': signOut(); break;
    case 'pick':
      if (!view.busy) { Object.assign(view, { selected: el.dataset.code, pin: '', msg: null, shake: false }); render(); }
      break;
    case 'key': pressKey(el.dataset.key); break;
    case 'home': go({ name: 'home' }); break;
    case 'settings': go({ name: 'settings' }); break;
    case 'avatar': {
      view.avatar = el.dataset.value;
      const form = document.getElementById('settings-form');
      const keep = form ? Object.fromEntries(new FormData(form)) : {};
      render();
      restoreForm(keep);
      break;
    }
    case 'study': startSession(el.dataset.deck); break;
    case 'flip': if (!view.flipped) { view.flipped = true; render(); } break;
    case 'speak': speak(view.queue[view.index].w, me.prefs.speechRate); break;
    case 'grade': grade(el.dataset.got === '1'); break;
    case 'refresh': loadKids().then(render, () => toast('Could not refresh. Check the internet.')); break;
    case 'reset': resetKid(el.dataset.code); break;
  }
});

// Keep unsaved form choices when the avatar picker re-renders the settings form.
function restoreForm(values) {
  const form = document.getElementById('settings-form');
  if (!form) return;
  for (const name of ['showPinyin', 'showEnglish']) form.elements[name].checked = values[name] === 'on';
  for (const name of ['sessionSize', 'speechRate']) if (values[name]) form.elements[name].value = values[name];
}

app.addEventListener('change', (e) => {
  if (e.target.dataset.action === 'set-level') setLevel(e.target.dataset.code, Number(e.target.value));
});

app.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id !== 'settings-form') return;
  const form = new FormData(e.target);
  me.prefs = {
    ...me.prefs,
    avatar: view.avatar ?? me.prefs.avatar,
    showPinyin: form.get('showPinyin') === 'on',
    showEnglish: form.get('showEnglish') === 'on',
    sessionSize: Number(form.get('sessionSize')),
    speechRate: Number(form.get('speechRate')),
  };
  background(session.auth.savePrefs(me.code, me.prefs), 'your settings');
  toast('Saved ✓');
  go({ name: 'home' });
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.matches('input, select, textarea')) return;
  if (view.name === 'signin') {
    if (/^[0-9]$/.test(e.key)) { pressKey(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { pressKey('back'); e.preventDefault(); }
    else if (e.key === 'Escape') pressKey('clear');
    return;
  }
  if (view.name !== 'study') return;
  if (!view.flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); view.flipped = true; render(); return; }
  if (view.flipped) {
    if (e.key === 'ArrowRight' || e.key === '2') grade(true);
    else if (e.key === 'ArrowLeft' || e.key === '1') grade(false);
    else if (e.key.toLowerCase() === 's') speak(view.queue[view.index].w, me.prefs.speechRate);
  }
});

// Show or hide the offline note when the network changes.
for (const ev of ['online', 'offline']) {
  window.addEventListener(ev, () => { if (['home', 'parent', 'signin'].includes(view.name)) render(); });
}

// Update the lock message while a locked account is selected.
setInterval(() => { if (view.name === 'signin' && view.selected && !view.busy && L.lockState(view.selected).locked) render(); }, 20000);

boot();

// All Firebase code for KidsChinese: sign-in, sign-out, who is signed in, and progress data.
// Pages do not import this file directly. They use ../load.js, which loads this file with a
// time limit and reports when Firebase cannot load.
//
// Firebase project: Kids Games (kidsgame-7a262), shared with the Kids Games site.
// Firestore data (rules: KidsChinese block in kidsgames/firebase/firestore.rules):
//   chinese/{code}                 { level, updatedAt, updatedBy }        parents write
//   chinese/{code}/data/summary    { stars, streak, daily, updatedAt }    the account itself writes
//   chinese/{code}/data/prefs      { showPinyin, showEnglish, sessionSize, speechRate, avatar, updatedAt }
//   chinese/{code}/cards/{cardId}  { box, due, seen, right, updatedAt }   the account itself writes
// {code} is any account (children and parents: parents study too).
// A parent sets the level of a child and of themself. A parent resets progress (of a child or
// of themself) by deleting the cards and the summary.
//
// Offline: Firestore keeps a copy on the device. Reads use the copy when there is no
// internet, and writes wait on the device until the internet comes back.
//
// Local emulator (for tests only): open http://localhost:8000/?emulator on a computer with
// the Firebase emulators running (see firebase/tests/README.md).

import { FIREBASE_CONFIG, SDK } from './config.js';
import { accountForEmail, accountForCode } from '../accounts.js';

const EMULATOR = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  && new URLSearchParams(location.search).has('emulator');
const config = EMULATOR ? { apiKey: 'demo-key', projectId: 'demo-kidsgames', authDomain: 'localhost' } : FIREBASE_CONFIG;

if (!config) throw Object.assign(new Error('Firebase is not set up yet.'), { code: 'app/not-configured' });

const { initializeApp } = await import(`${SDK}/firebase-app.js`);
const A = await import(`${SDK}/firebase-auth.js`);
const F = await import(`${SDK}/firebase-firestore.js`);

const app = initializeApp(config);
const auth = A.getAuth(app);

let db;
try {
  db = F.initializeFirestore(app, {
    localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }),
  });
} catch (e) {
  console.warn('[kidschinese] No offline copy:', e);
  db = F.getFirestore(app);
}

if (EMULATOR) {
  A.connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  F.connectFirestoreEmulator(db, 'localhost', 8080);
}

// Resolves once Firebase has restored any saved sign-in. This needs no network.
const authReady = new Promise((resolve) => {
  const stop = A.onAuthStateChanged(auth, (user) => { stop(); resolve(user); });
});

/* ---------- sign-in ---------- */

// Returns { uid, code, role } for the signed-in person, or null if nobody is signed in.
// Throws "not-family" (error.who = the account name, for example "Guest") if the account is
// not a KidsChinese account. Do not sign it out here: the sign-in is shared with Kids Games.
export async function currentPlayer() {
  await authReady;
  const user = auth.currentUser;
  if (!user) return null;
  const acc = accountForEmail(user.email);
  if (!acc) {
    const name = String(user.email || '').split('@')[0];
    throw Object.assign(new Error('not-family'), { who: name.charAt(0).toUpperCase() + name.slice(1) });
  }
  return { uid: user.uid, code: acc.code, role: acc.role };
}

// Signs in with the account code and PIN. Errors keep the Firebase code in error.code,
// for example "auth/invalid-credential".
export async function signIn(code, pin) {
  const acc = accountForCode(code);
  if (!acc) throw Object.assign(new Error('Unknown account'), { code: 'app/unknown-account' });
  await authReady;
  await A.signInWithEmailAndPassword(auth, acc.email, pin);
  return currentPlayer();
}

export async function signOutPlayer() {
  await A.signOut(auth);
}

/* ---------- progress data ---------- */

const COL = 'chinese';   // the KidsChinese collection in the shared Kids Games database
const learnerRef = (code) => F.doc(db, COL, code);
const summaryRef = (code) => F.doc(db, COL, code, 'data', 'summary');
const prefsRef = (code) => F.doc(db, COL, code, 'data', 'prefs');
const cardsRef = (code) => F.collection(db, COL, code, 'cards');
const cardRef = (code, id) => F.doc(db, COL, code, 'cards', id);

function checkAccount(code) {
  if (!accountForCode(code)) throw Object.assign(new Error('Not an account: ' + code), { code: 'app/not-account' });
}

// Reads one document. Offline: uses the copy on the device. Returns the data or null.
async function read(ref) {
  try {
    const s = await F.getDoc(ref);
    return s.exists() ? s.data() : null;
  } catch (e) {
    if (e && e.code === 'permission-denied') throw e;
    try {
      const s = await F.getDocFromCache(ref);
      return s.exists() ? s.data() : null;
    } catch {
      return null;
    }
  }
}

const strip = ({ updatedAt, updatedBy, ...rest }) => rest;

/**
 * Everything about one account (a child, or a parent who studies):
 * { level, prefs, summary, cards: { [cardId]: { box, due, seen, right } } }
 * level, prefs and summary are null when not set yet.
 */
export async function loadLearner(code) {
  checkAccount(code);
  const [learner, summary, prefs, cardSnap] = await Promise.all([
    read(learnerRef(code)), read(summaryRef(code)), read(prefsRef(code)), F.getDocs(cardsRef(code)),
  ]);
  const cards = {};
  cardSnap.forEach((d) => { cards[d.id] = strip(d.data()); });
  return {
    level: learner ? learner.level : null,
    prefs: prefs ? strip(prefs) : null,
    summary: summary ? strip(summary) : null,
    cards,
  };
}

/**
 * Saves one answer: the new card state and the new summary, together.
 * The device copy changes at once. The promise resolves when the server has the change,
 * which can be much later when there is no internet. Do not wait for it to go on.
 */
export function saveAnswer(code, cardId, card, summary) {
  checkAccount(code);
  const b = F.writeBatch(db);
  b.set(cardRef(code, cardId), {
    box: card.box, due: card.due, seen: card.seen, right: card.right, updatedAt: F.serverTimestamp(),
  });
  b.set(summaryRef(code), {
    stars: summary.stars,
    streak: { count: summary.streak.count, last: summary.streak.last },
    daily: { date: summary.daily.date, count: summary.daily.count },
    updatedAt: F.serverTimestamp(),
  });
  return b.commit();
}

export function savePrefs(code, prefs) {
  checkAccount(code);
  return F.setDoc(prefsRef(code), {
    showPinyin: !!prefs.showPinyin,
    showEnglish: !!prefs.showEnglish,
    sessionSize: prefs.sessionSize,
    speechRate: prefs.speechRate,
    avatar: String(prefs.avatar),
    updatedAt: F.serverTimestamp(),
  });
}

/* ---------- parent controls ---------- */

export async function setLevel(code, level) {
  checkAccount(code);
  const me = await currentPlayer();
  return F.setDoc(learnerRef(code), { level, updatedAt: F.serverTimestamp(), updatedBy: me.code });
}

// Deletes all card progress and the summary (stars, streak, daily count) of one learner.
// The level and the preferences stay. Needs internet to finish.
export async function resetProgress(code) {
  checkAccount(code);
  const snap = await F.getDocs(cardsRef(code));
  const refs = [...snap.docs.map((d) => d.ref), summaryRef(code)];
  for (let i = 0; i < refs.length; i += 400) {
    const b = F.writeBatch(db);
    refs.slice(i, i + 400).forEach((r) => b.delete(r));
    await b.commit();
  }
  return snap.size;
}

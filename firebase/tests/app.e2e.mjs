// End-to-end test: the real app with the real Firebase SDK 13.0.0, in headless Chromium,
// against the Firebase Auth and Firestore emulators, with the Kids Games rules (which hold the
// KidsChinese block). No real account and no real PIN.
//
// Run in the firebase/ folder (needs Java 11+, Playwright with Chromium, and a Kids Games
// checkout next to this repo or KIDSGAMES_RULES; see tests/copy-rules.mjs):
//   npm run e2e
// That starts the emulators, serves the repo at http://localhost:8000/, and runs this file.
// The page opens with ?emulator, so js/firebase/auth.js connects to the emulators.
// Accounts are made like Kids Games: <code>@kidsgames.invalid plus players/{uid} = { code }.

import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { DECKS } from '../../js/data/words.js';

// Number of words of a deck at a level (a round has at most 10 cards).
const roundSize = (id, lv = 1) => Math.min(10, DECKS.find((d) => d.id === id).words.filter((w) => w.lv <= lv).length);
const FAMILY = roundSize('family');
const ANIMALS = roundSize('animals');

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = 'http://localhost:8000/';
const APP = SITE + '?emulator';
const PROJECT = 'demo-kidsgames';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const PIN = { YC: '111111', JY: '222222', SL: '333333', CJ: '444444', Guest: '555555' };   // emulator only
const OUT = process.env.E2E_SCREENSHOTS || null;

let server, browser;

// Makes a Kids Games account: the Auth user and players/{uid} = { code }.
async function makeAccount(code, password, withPlayerDoc = true) {
  const email = code.toLowerCase() + '@kidsgames.invalid';
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!r.ok) throw new Error('signUp failed: ' + (await r.text()));
  const { localId } = await r.json();
  if (!withPlayerDoc) return;
  const w = await fetch(`${FS}/players/${localId}`, {
    method: 'PATCH', headers: { Authorization: 'Bearer owner', 'content-type': 'application/json' },
    body: JSON.stringify({ fields: { code: { stringValue: code } } }),
  });
  if (!w.ok) throw new Error('players doc failed: ' + (await w.text()));
}

// Reads Firestore as the emulator owner (no rules).
async function fsGet(p) {
  const r = await fetch(`${FS}/${p}`, { headers: { Authorization: 'Bearer owner' } });
  if (r.status === 404) return null;
  return r.json();
}
async function cardCount(code) {
  const j = await fsGet(`chinese/${code}/cards?pageSize=500`);
  return j && j.documents ? j.documents.length : 0;
}
const intField = (doc, name) => Number(doc.fields[name].integerValue);

async function waitFor(fn, ms = 10000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('waitFor timed out');
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function newPage(o = {}) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, ...o,
  });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  if (proxy) page.proxyUsed = true;
  return page;
}

async function shot(page, name) {
  if (OUT) await page.screenshot({ path: path.join(OUT, name + '.png') });
}

async function signIn(page, code, pin = PIN[code]) {
  await page.click(`[data-action=pick][data-code=${code}]`);
  for (const d of pin) await page.click(`[data-action=key][data-key="${d}"]`);
}

async function studyRound(page, deck, { missFirst = false } = {}) {
  await page.click(`[data-action=study][data-deck=${deck}]`);
  let first = true;
  for (let i = 0; i < 40; i++) {
    if (!(await page.$('.card[data-action=flip]'))) break;
    await page.click('.card[data-action=flip]');
    await page.click(`[data-action=grade][data-got="${missFirst && first ? 0 : 1}"]`);
    first = false;
  }
  await page.waitForSelector('[data-screen=done]');
}

before(async () => {
  for (const [code, pin] of Object.entries(PIN)) await makeAccount(code, pin);
  server = spawn('python3', ['-m', 'http.server', '8000', '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  await waitFor(() => fetch(SITE).then((r) => r.ok, () => false));
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  browser = await chromium.launch(proxy ? { proxy: { server: proxy, bypass: 'localhost,127.0.0.1' } } : {});
});

after(async () => {
  await browser?.close();
  server?.kill();
});

test('Guest signed in from Kids Games: refused, not signed out, then sign-out works', async () => {
  const page = await newPage();
  await page.goto(APP);
  await page.waitForSelector('[data-screen=signin]');
  assert.equal(await page.$('[data-code=Guest]'), null, 'no Guest button');
  // Sign in as Guest the way Kids Games does: same project, same default app, same site.
  await page.evaluate(async (pin) => {
    const A = await import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js');
    await A.signInWithEmailAndPassword(A.getAuth(), 'guest@kidsgames.invalid', pin);
  }, PIN.Guest);
  await page.reload();
  await page.waitForSelector('[data-screen=problem]');
  assert.match(await page.textContent('#app'), /Guest cannot use KidsChinese/);
  await shot(page, '01-guest');
  await page.reload();
  await page.waitForSelector('[data-screen=problem]');   // still signed in: not signed out automatically
  await page.click('[data-action=signout]');
  await page.waitForSelector('[data-screen=signin]');
  assert.deepEqual(page.errors, []);
});

test('learner: wrong PIN, sign-in, study, progress saved to Firestore', async () => {
  const page = await newPage();
  await page.goto(APP);
  await page.waitForSelector('[data-screen=signin]');
  await shot(page, '02-signin');

  await signIn(page, 'YC', '000000');
  await page.waitForSelector('.msg.bad');
  assert.match(await page.textContent('.msg'), /Wrong PIN\. 9 tries left/);

  await signIn(page, 'YC');
  await page.waitForSelector('[data-screen=home]');
  assert.equal(await page.evaluate(() => localStorage.getItem('kg-lastPlayer')), 'YC');
  const home = await page.textContent('#app');
  assert.match(home, /初級 Beginner/);
  assert.match(home, /of 101 words learned/);
  assert.match(home, /Signed in as YC/);
  await shot(page, '03-home');

  await studyRound(page, 'family', { missFirst: true });
  await shot(page, '04-done');
  await waitFor(async () => (await cardCount('YC')) === FAMILY);
  const sum = await waitFor(() => fsGet('chinese/YC/data/summary'));
  assert.equal(intField(sum, 'stars'), FAMILY);      // all but one right first time, + 1 right on the retry
  assert.equal(intField(sum.fields.daily.mapValue, 'count'), FAMILY + 1);
  assert.equal(await cardCount('JY'), 0);

  // Preferences.
  await page.click('[data-action=home]');
  await page.click('[data-action=settings]');
  assert.match(await page.textContent('#app'), /a parent sets the level/);
  assert.equal(await page.$('select[name=maxLevel]'), null);
  await page.click('[data-action=avatar][data-value="🦊"]');
  await page.uncheck('input[name=showEnglish]');
  await page.click('button[type=submit]');
  const prefs = await waitFor(() => fsGet('chinese/YC/data/prefs'));
  assert.equal(prefs.fields.avatar.stringValue, '🦊');
  assert.equal(prefs.fields.showEnglish.booleanValue, false);

  // A reload keeps the sign-in and the progress.
  await page.reload();
  await page.waitForSelector('[data-screen=home]');
  assert.match(await page.textContent('header'), /🦊/);
  assert.match(await page.textContent('header'), new RegExp('⭐ ' + FAMILY));
  assert.deepEqual(page.errors, []);
});

test('learner offline: answers stay on the device and reach Firestore later', async () => {
  const page = await newPage();
  await page.goto(APP);
  await page.waitForSelector('[data-screen=signin]');
  await signIn(page, 'JY');
  await page.waitForSelector('[data-screen=home]');
  await page.context().setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await page.waitForSelector('.signed-in .off');
  await shot(page, '05-offline');
  await studyRound(page, 'animals');
  await new Promise((r) => setTimeout(r, 1000));
  assert.equal(await cardCount('JY'), 0, 'nothing reaches the server while offline');
  await page.context().setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitFor(async () => (await cardCount('JY')) === ANIMALS, 20000);
  assert.deepEqual(page.errors, []);
});

test('parent: sees both learners, sets a level, resets progress', async () => {
  const page = await newPage({ viewport: { width: 1024, height: 900 } });
  await page.goto(APP);
  await page.waitForSelector('[data-screen=signin]');
  await signIn(page, 'SL');
  await page.waitForSelector('[data-screen=parent]');
  const text = await page.textContent('#app');
  assert.match(text, /家長 Parent · SL/);
  assert.match(text, /Level not set yet/);
  assert.equal(await page.$$eval('.kid', (x) => x.length), 2);
  await page.click('summary >> nth=0');
  await shot(page, '06-parent');

  // Set JY to level 2.
  await page.selectOption('select[data-code=JY]', '2');
  const lv = await waitFor(async () => {
    const d = await fsGet('chinese/JY');
    return d && intField(d, 'level') === 2 && d;
  });
  assert.equal(lv.fields.updatedBy.stringValue, 'SL');

  // Reset YC.
  page.once('dialog', (d) => d.accept());
  await page.click('[data-action=reset][data-code=YC]');
  await waitFor(async () => (await cardCount('YC')) === 0);
  assert.equal(await fsGet('chinese/YC/data/summary'), null);
  assert.notEqual(await fsGet('chinese/YC/data/prefs'), null, 'preferences stay after a reset');
  assert.equal(await cardCount('JY'), ANIMALS, 'the other learner is not touched');

  await page.click('[data-action=signout]');
  await page.waitForSelector('[data-screen=signin]');
  assert.deepEqual(page.errors, []);
});

test('the learner sees the level the parent set, and the reset', async () => {
  const page = await newPage();
  await page.goto(APP);
  await page.waitForSelector('[data-screen=signin]');
  await signIn(page, 'JY');
  await page.waitForSelector('[data-screen=home]');
  assert.match(await page.textContent('#app'), /中級 Intermediate/);
  assert.match(await page.textContent('#app'), /of 175 words learned/);
  await page.click('[data-action=signout]');
  await signIn(page, 'YC');
  await page.waitForSelector('[data-screen=home]');
  assert.match(await page.textContent('header'), /⭐ 0/);
  assert.match(await page.textContent('#app'), /0 of 101 words learned/);
  assert.match(await page.textContent('header'), /🦊/, 'avatar kept after reset');
  assert.deepEqual(page.errors, []);
});

test('10 wrong PINs lock the account on this device', async () => {
  const page = await newPage();
  await page.goto(APP);
  await page.waitForSelector('[data-screen=signin]');
  for (let i = 0; i < 10; i++) {
    await signIn(page, 'CJ', '000000');
    await page.waitForSelector('.msg.bad');
  }
  assert.match(await page.textContent('.msg'), /CJ is locked for 30 more minutes/);
  const lock = await page.evaluate(() => JSON.parse(localStorage.getItem('kg-lock')));
  assert.ok(lock.CJ && lock.CJ.until, 'the lock uses the Kids Games key kg-lock');
  // A right PIN is not sent while locked.
  await signIn(page, 'CJ');
  await new Promise((r) => setTimeout(r, 1500));
  assert.equal(await page.getAttribute('#app', 'data-screen'), 'signin');
  await shot(page, '07-locked');
  // Other accounts are not locked.
  await signIn(page, 'SL');
  await page.waitForSelector('[data-screen=parent]');
});

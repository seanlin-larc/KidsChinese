import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ACCOUNTS, LEARNERS, PARENTS, EMAIL_DOMAIN, accountForEmail } from '../js/accounts.js';
import { FIREBASE_CONFIG } from '../js/firebase/config.js';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES = process.env.KIDSGAMES_RULES || path.join(repo, '..', 'kidsgames', 'firebase', 'firestore.rules');

test('accounts: Kids Games emails, codes and roles; no Guest', () => {
  assert.equal(EMAIL_DOMAIN, '@kidsgames.invalid');
  assert.deepEqual(LEARNERS, ['YC', 'JY']);
  assert.deepEqual(PARENTS, ['SL', 'CJ', 'AMA']);
  assert.equal(ACCOUNTS.find((a) => a.code === 'AMA').name, '嬤');
  for (const a of ACCOUNTS) {
    assert.equal(a.email, a.code.toLowerCase() + EMAIL_DOMAIN);
    assert.equal(accountForEmail(a.email.toUpperCase()), a);
  }
  assert.equal(accountForEmail('guest@kidsgames.invalid'), null);
  assert.equal(accountForEmail('yc@example.com'), null);
  assert.equal(accountForEmail(''), null);
});

test('Firebase config is the Kids Games project', () => {
  assert.equal(FIREBASE_CONFIG.projectId, 'kidsgame-7a262');
  assert.equal(FIREBASE_CONFIG.authDomain, 'kidsgame-7a262.firebaseapp.com');
});

test('the Kids Games rules have the KidsChinese block with the same codes', (t) => {
  if (!existsSync(RULES)) { t.skip(`no Kids Games checkout at ${RULES} (set KIDSGAMES_RULES)`); return; }
  const rules = readFileSync(RULES, 'utf8');
  assert.ok(rules.includes('match /chinese/{code}'), 'no KidsChinese block');
  const codes = (name) => {
    const m = new RegExp(`function ${name}\\([^)]*\\) \\{[^}]*?in \\[([^\\]]+)\\]`).exec(rules);
    assert.ok(m, `${name}() not found`);
    return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
  };
  assert.deepEqual(codes('kcLearnerCode'), [...LEARNERS].sort());
  assert.deepEqual(codes('kcParentCode'), [...PARENTS].sort());
});

test('no PIN-like secrets in the account list', () => {
  const src = readFileSync(new URL('../js/accounts.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\b\d{6}\b/);
});

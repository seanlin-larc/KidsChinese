import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ACCOUNTS, LEARNERS, PARENTS, EMAIL_DOMAIN, accountForEmail } from '../js/accounts.js';

const rules = readFileSync(new URL('../firebase/firestore.rules', import.meta.url), 'utf8');

test('accounts: codes, emails and roles', () => {
  assert.deepEqual(LEARNERS, ['YC', 'JY']);
  assert.deepEqual(PARENTS, ['SL', 'CJ']);
  for (const a of ACCOUNTS) {
    assert.equal(a.email, a.code.toLowerCase() + EMAIL_DOMAIN);
    assert.equal(accountForEmail(a.email.toUpperCase()), a);
  }
  assert.equal(accountForEmail('yc@example.com'), null);
  assert.equal(accountForEmail(''), null);
});

test('the Firestore rules use the same emails and roles as js/accounts.js', () => {
  const parentLine = /function isParent\(\) \{\s*return email\(\) in \[([^\]]+)\]/.exec(rules);
  assert.ok(parentLine, 'isParent() not found in the rules');
  const parentEmails = [...parentLine[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(parentEmails.sort(), ACCOUNTS.filter((a) => a.role === 'parent').map((a) => a.email).sort());
  const learnerCodes = /function isLearnerCode\(code\) \{\s*return code in \[([^\]]+)\]/.exec(rules);
  assert.deepEqual([...learnerCodes[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort(), [...LEARNERS].sort());
  for (const a of ACCOUNTS.filter((x) => x.role === 'learner')) {
    assert.ok(rules.includes(`(code == '${a.code}' && email() == '${a.email}')`), `isSelf() is missing ${a.code}`);
  }
});

test('no PIN-like secrets in the account list', () => {
  const src = readFileSync(new URL('../js/accounts.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\b\d{6}\b/);
});

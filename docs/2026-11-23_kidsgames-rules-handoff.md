# Handoff: add the KidsChinese rules to the `kidsgames` repo

**Done (2026-11-23).** Kids Games `main` has the patch (`c7cd314`); `firebase/firestore.rules` SHA-256 is
`d5383d42…698d`. Commit `ccfd684` fixed the test config, so plain `npm test` works (18 of 18). The
work-around in step 4 is no longer necessary.

For: a new chat (Claude Code, Codex or another agent) that has **push access to `seanlin-larc/kidsgames`**.
From: the KidsChinese session, 2026-11-23. That session could not push to `kidsgames`.

## Task in one sentence

Apply the prepared patch to `seanlin-larc/kidsgames` on a new branch, run the rules tests, push the
branch, and merge it to `main` only when Sean asks.

## Why

- KidsChinese (https://seanlin-larc.github.io/KidsChinese/, repo `seanlin-larc/KidsChinese`) uses the
  **Kids Games Firebase project** (`kidsgame-7a262`) and the Kids Games accounts (Sean's decision, 2026-11-23).
- A Firestore database has **one** set of rules. So the KidsChinese rules must be in
  `kidsgames/firebase/firestore.rules`, the file that Sean publishes in the Firebase console.
- **Sean already published the merged rules file (2026-11-23).** The `kidsgames` repo `main` still has the
  old file. If someone publishes the file from `main` now, the KidsChinese rules disappear and the
  children see "Cannot read progress". This task makes the repo match what is live.

## What the patch changes (4 files, Kids Games rules unchanged)

| File | Change |
|---|---|
| `firebase/firestore.rules` | New block "KidsChinese flash cards" before "Everything else stays locked", for collection `chinese`. One header comment line. No existing rule changed |
| `firebase/tests/kidschinese.rules.test.mjs` | New: 9 emulator tests for the block |
| `firebase/package.json` | `test` runs both test files, one at a time (`--test-concurrency=1`) |
| `README.md` | New section "KidsChinese uses this project"; one row in the storage-key table |

Rules summary (role from `players/{uid}.code`, like the rest of the file):

| | YC / JY (learner) | SL / CJ (parent) | Guest, others |
|---|---|---|---|
| Read own `chinese/{code}/…` | ✓ | — | ✗ |
| Read the other learner | ✗ | ✓ | ✗ |
| Write cards and summary | own only | ✗ | ✗ |
| Write prefs | own only | ✓ | ✗ |
| Set level (`chinese/{code}`) | ✗ | ✓ | ✗ |
| Delete cards and summary (reset) | ✗ | ✓ | ✗ |

## Files

- Patch (made with `git format-patch`, one commit, base `8d4e80a` = `kidsgames` `main` on 2026-11-23):
  https://raw.githubusercontent.com/seanlin-larc/KidsChinese/main/docs/kidsgames-kidschinese-rules.patch
- The same patch is in this folder: `docs/kidsgames-kidschinese-rules.patch`.
- SHA-256 of `firebase/firestore.rules` **after** the patch, which is the file Sean published:
  `d5383d4247fa34ea8eb34edd0d74efcea94722269e2461952c694a98c800698d`

## Steps

1. Clone `seanlin-larc/kidsgames`. Make a branch, for example `claude/kidschinese-rules`.
2. Download the patch and apply it:

   ```bash
   curl -fsSLo /tmp/kc.patch https://raw.githubusercontent.com/seanlin-larc/KidsChinese/main/docs/kidsgames-kidschinese-rules.patch
   ```

   ```bash
   git am /tmp/kc.patch
   ```

   If `main` moved after `8d4e80a` and `git am` fails, run `git am --abort`, then apply with
   `git am -3 /tmp/kc.patch` and resolve. Keep every existing Kids Games rule as it is.
3. Check that the rules file is the published file:

   ```bash
   sha256sum firebase/firestore.rules
   ```

   It must be `d5383d42…698d` (above). If `main` changed the rules after `8d4e80a`, the sum differs.
   Then tell Sean: the live rules do not have those `main` changes, and he must publish the new file.
4. Run the rules tests (needs Java 11 or later):

   ```bash
   cd firebase && npm install && npm test
   ```

   Expected: **18 of 18 pass** (9 Kids Games + 9 KidsChinese).

   Known problem, already in `main` (not from this patch): with firebase-tools 14.21.0, `npm test` can stop
   with `../firestore.rules is outside of project directory`, because `tests/firebase.json` points outside
   its folder. Work-around used on 2026-11-23 (do not commit the temporary file):

   ```bash
   sed 's#"../firestore.rules"#"firestore.rules"#' tests/firebase.json > firebase.tmp.json
   ```

   ```bash
   npx firebase emulators:exec --project demo-kidsgames --only firestore --config firebase.tmp.json "node --test --test-concurrency=1 tests/firestore.rules.test.mjs tests/kidschinese.rules.test.mjs"
   ```

   ```bash
   rm firebase.tmp.json firestore-debug.log
   ```

   Ask Sean before you fix that config in a separate commit.
5. Do not commit `firebase/firestore-debug.log` (the emulator writes it; `.gitignore` does not list it).
6. Push the branch. **Merge to `main` only when Sean asks** (`main` is the live Kids Games site).
   The patch changes no page, so the Kids Games site does not change. `sw.js` / `CACHE` need no change.
7. Do not publish rules and do not change Firebase settings. Sean publishes rules himself.

## Results on 2026-11-23 (KidsChinese session)

- `kidsgames` rules tests on the merged file: 18 of 18 passed, two runs (emulator, Java, firebase-tools 14.21.0).
- KidsChinese end-to-end test with these rules (real Firebase SDK 13.0.0, Auth + Firestore emulators,
  `players/{uid}` documents): 6 of 6 passed, including "Guest is refused and not signed out".
- Not tested: the live project and real PINs.

## Things that this change affects in Kids Games (no action needed, but good to know)

- **One sign-in for both sites** on a device (same project, same apiKey, same website). A sign-out on
  KidsChinese also signs out of Kids Games.
- KidsChinese never signs out an account by itself. A Guest session from Kids Games sees "Not for this
  account" there.
- KidsChinese reads and writes the Kids Games device keys `kg-lock` (same format) and `kg-lastPlayer`.
  Wrong PINs on either site count together.
- `admin/reset-pin.mjs`: no change. A new PIN works on both sites.
- Deleting a `players/{uid}` document now removes that account's access to both sites.

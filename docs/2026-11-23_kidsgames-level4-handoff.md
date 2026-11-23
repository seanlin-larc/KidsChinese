# Handoff: allow level 4 in the Kids Games rules

**Status (2026-11-23): not done.** The KidsChinese session could not push to `seanlin-larc/kidsgames`.

For: a chat (Claude Code, Codex or another agent) that has **push access to `seanlin-larc/kidsgames`**,
and for Sean, who publishes the rules.

## Task in one sentence

Apply `docs/kidsgames-level4-rules.patch` (this repo) to `seanlin-larc/kidsgames` on a new branch, run the
rules tests, push the branch, merge it to `main` when Sean asks, and then Sean publishes the complete file.

## Why

KidsChinese now has 4 levels: 1 學前 Starters, 2 初階 Beginner, 3 四年級 Grade 4, 4 小學 Elementary.
The KidsChinese block of `kidsgames/firebase/firestore.rules` accepts `level in [1, 2, 3]` only.
So a parent cannot set 小學 Elementary: Firestore refuses the write, and the page shows
"Could not set the level". Levels 1–3 work without this change.

## What the patch changes (2 files)

| File | Change |
|---|---|
| `firebase/firestore.rules` | `kcLevelOk`: `d.level in [1, 2, 3]` → `d.level in [1, 2, 3, 4]`. One comment line says "(1–4)" |
| `firebase/tests/kidschinese.rules.test.mjs` | A parent can set level 4. Level 5 (not 4) is the bad value |

No other rule changes. The Kids Games rules do not change.

## Steps

1. In a `kidsgames` checkout: `git checkout -b kidschinese-level4 origin/main`.
2. `git apply ../KidsChinese/docs/kidsgames-level4-rules.patch` (the patch is against `main` at `ccfd684`).
3. `cd firebase && npm install && npm test`. Expect 18 of 18 to pass.
4. Push the branch. Merge to `main` only when Sean asks.
5. Sean: open the Firebase console for `kidsgame-7a262` → Firestore Database → Rules, replace all the
   text with the **complete** `firebase/firestore.rules` from `main`, and click **Publish**.
   Do not publish only the KidsChinese block.

## Checked in the KidsChinese session (2026-11-23)

- Kids Games rules tests with the patch: 18 of 18 pass (`npm test` in `kidsgames/firebase`).
- KidsChinese end-to-end test with the patched rules and a parent that sets JY to level 4: 6 of 6 pass.
- KidsChinese end-to-end test with the current rules (`ccfd684`): 6 of 6 pass.

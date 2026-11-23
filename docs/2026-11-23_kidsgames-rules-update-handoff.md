# Handoff: Kids Games rules update for KidsChinese (level 4, parents study, 嬤)

繁體中文版：[2026-11-23_kidsgames-rules-update-handoff_zhtw.md](2026-11-23_kidsgames-rules-update-handoff_zhtw.md)

**Status (2026-11-23): done.** Kids Games `main` has the patch (commit `b91fa7b`), and Sean published
the complete rules file. See "Result" at the end.
This replaces the earlier level-4-only handoff.

For: a chat (Claude Code, Codex or another agent) that has **push access to `seanlin-larc/kidsgames`**,
and for Sean, who publishes the rules.

## Task in one sentence

Apply `docs/kidsgames-rules-update.patch` (this repo) to `seanlin-larc/kidsgames` on a new branch, run the
rules tests, push the branch, merge it to `main` when Sean asks, and then Sean publishes the complete file.

## Why

The KidsChinese app changed in three ways. The published rules refuse all three:

1. **Level 4 (小學 Elementary).** The rules accept `level in [1, 2, 3]` only.
2. **Parents study too.** SL, CJ and 嬤 can practise cards with their own progress and their own level
   (a test player). The rules allow progress for YC and JY only.
3. **New parent 嬤 (grandma), code `AMA`,** account `ama@kidsgames.invalid`. She has the same access as SL and CJ.

Before the new rules were published, SL and CJ see the parent page as before, but with no 練習 Study button
and a note about this update. 嬤 sees "Cannot read progress". YC and JY are not affected.
Level 4 also fails until then ("Could not set the level").

## What the patch changes (3 files)

| File | Change |
|---|---|
| `firebase/firestore.rules` | KidsChinese block only: `level in [1, 2, 3, 4]`; new `kcParentCode()` = SL, CJ, AMA; `kcSelf()` covers parents; new `kcManages()` = a parent and (a child or themself). Header comments name AMA |
| `firebase/tests/kidschinese.rules.test.mjs` | AMA in the test accounts; level 4 allowed, 5 refused; new test: a parent studies with own data and cannot read or change another parent's data |
| `README.md` | "KidsChinese uses this project": SL, CJ and AMA are parents; parents study; AMA is not on the Kids Games sign-in page |

What a parent can do after the change:

| | Own data | YC / JY data | Another parent's data |
|---|---|---|---|
| Read | ✓ | ✓ | ✗ |
| Save card answers and summary | ✓ | ✗ | ✗ |
| Set level | ✓ | ✓ | ✗ |
| Change preferences | ✓ | ✓ | ✗ |
| Reset progress | ✓ | ✓ | ✗ |

No Kids Games rule changes. `players/{uid}` stays "console only". The Kids Games pages do not change:
AMA is not added to `shared/session.js`, so she is not on the Kids Games sign-in page.

## Steps

1. In a `kidsgames` checkout: `git checkout -b kidschinese-rules-update origin/main`.
2. `git apply ../KidsChinese/docs/kidsgames-rules-update.patch` (the patch is against `main` at `ccfd684`).
3. `cd firebase && npm install && npm test`. Expect 19 of 19 to pass.
4. Push the branch. Merge to `main` only when Sean asks.
5. Sean publishes the complete file: see `firebase/SETUP.md` in KidsChinese, section 3.

## Checked in the KidsChinese session (2026-11-23)

- Kids Games rules tests with the patch: 19 of 19 pass.
- KidsChinese end-to-end test with the patched rules: 7 of 7 pass. This includes 嬤: sign-in, the parent page,
  a study round saved to `chinese/AMA`, and her own level.

## Result (2026-11-23)

- A Claude Code session with push access applied the patch to `seanlin-larc/kidsgames` without changes.
- Kids Games rules tests: 19 of 19 pass. The KidsChinese `tests/accounts.test.mjs` passes with the new rules file.
- Kids Games `main`: fast-forward from `ccfd684` to `b91fa7b`. The Kids Games pages did not change.
- Sean published the complete file from Kids Games `main` in the Firebase console.
- Side effect: the Kids Games rules give family access to every account with a `players/{uid}` document.
  So AMA can also read Kids Games scores and save her own results, the same as Guest.
  She cannot change the puzzle library (SL and CJ only).

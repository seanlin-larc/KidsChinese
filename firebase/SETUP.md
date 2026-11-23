# Firebase setup for KidsChinese

KidsChinese uses the **Kids Games** Firebase project (`kidsgame-7a262`) and its accounts.
There is no new project, no new account and no new PIN.

| Already done (Kids Games) | Still to do |
|---|---|
| Accounts YC, JY, SL, CJ, Guest (`<code>@kidsgames.invalid`), PIN = password | Publish the rules with the KidsChinese block (below) |
| `players/{uid}` documents with the codes | Sign in as SL and set each child's level |
| API key restriction: `https://seanlin-larc.github.io/*`, `http://localhost:8000/*` | |
| `admin/reset-pin.mjs` in the Kids Games repo | |

## 1. Publish the rules (one time, and after each rules change)

The rules for both sites are in **one file**: `firebase/firestore.rules` in the **Kids Games** repo.
The KidsChinese part is the block "KidsChinese flash cards" near the end (collection `chinese`).

1. Make sure the Kids Games file has that block. Status (2026-11-23): Sean published the merged file,
   and Kids Games `main` has the same file (commit `c7cd314`, from `docs/kidsgames-kidschinese-rules.patch`).
2. Open the [Firebase console for kidsgame-7a262](https://console.firebase.google.com/project/kidsgame-7a262/firestore) → **Firestore Database** → **Rules**.
3. Keep a copy of the current rules.
4. Replace all of the text with the **complete** Kids Games file. Click **Publish**.

Do not publish only the KidsChinese block: that removes the Kids Games rules.

What the KidsChinese block allows (the role comes from `players/{uid}.code`):

| | YC / JY (learner) | SL / CJ (parent) | Guest, others |
|---|---|---|---|
| Read own progress | ✓ | — | ✗ |
| Read the other learner's progress | ✗ | ✓ (both) | ✗ |
| Save answers, stars, streak | own only | ✗ | ✗ |
| Change display settings (Pinyin, English) | own only | ✓ | ✗ |
| Set a learner's level | ✗ | ✓ | ✗ |
| Reset a learner's progress | ✗ | ✓ | ✗ |

The Kids Games rules are not changed.

Pending (2026-11-23): the rules change for level 4 (小學 Elementary). See
`docs/2026-11-23_kidsgames-level4-handoff.md`.

## 2. Set the levels

1. Open https://seanlin-larc.github.io/KidsChinese/ and sign in as **SL** with the Kids Games PIN.
2. The parent page shows YC and JY. Set each child's **Level** (程度).
   The levels are 學前 Starters, 初階 Beginner, 四年級 Grade 4 and 小學 Elementary (see README, "Levels").
   小學 Elementary needs the rules change in `docs/2026-11-23_kidsgames-level4-handoff.md`.
3. Sign out. Sign in as **YC**, do one round, and check that the stars stay after a reload.

## Shared sign-in: what to know

- **One sign-in for both sites on a device.** A child who signs in to Kids Games is also signed in to
  KidsChinese, and the other way round. **Sign-out on one site also signs out of the other.**
- **Guest:** when Guest is signed in from Kids Games, KidsChinese shows "Not for this account" with a
  Sign out button. It does not sign Guest out by itself.
- **Wrong-PIN lock** (`kg-lock`) is shared: wrong PINs on either site count together.
- **Forgotten PIN:** use `admin/reset-pin.mjs` in the Kids Games repo. The new PIN works on both sites.
- **Remove an account's access:** delete its `players/{uid}` document in the console. Then the account
  can use neither site.
- **Offline:** after the first sign-in on a device, KidsChinese works without internet. Answers are kept
  on the device and sent later. (Kids Games uses its own 48-hour check-out for offline play.)
- **Costs:** both sites share the Firestore free tier (50,000 reads and 20,000 writes each day).
  Two kids use a small part of it. See https://firebase.google.com/pricing.

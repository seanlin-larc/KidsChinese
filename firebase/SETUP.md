# Firebase setup for KidsChinese

繁體中文版：[SETUP_zhtw.md](SETUP_zhtw.md)

KidsChinese uses the **Kids Games** Firebase project (`kidsgame-7a262`) and its accounts.
There is no new project, no new account and no new PIN.

| Already done (Kids Games) | Still to do |
|---|---|
| Accounts YC, JY, SL, CJ, Guest (`<code>@kidsgames.invalid`), PIN = password | Add 嬤 (section 3) |
| `players/{uid}` documents with the codes | Sign in as SL and set each child's level (section 2) |
| Rules with the KidsChinese block (2026-11-23) | |
| Rules update: level 4, parents study, 嬤 (2026-11-23) | |
| API key restriction: `https://seanlin-larc.github.io/*`, `http://localhost:8000/*` | |
| `admin/reset-pin.mjs` in the Kids Games repo | |

## 1. Publish the rules (one time, and after each rules change)

The rules for both sites are in **one file**: `firebase/firestore.rules` in the **Kids Games** repo.
The KidsChinese part is the block "KidsChinese flash cards" near the end (collection `chinese`).

1. Make sure the Kids Games file has that block. Status (2026-11-23): Sean published the updated file,
   and Kids Games `main` has the same file (commit `b91fa7b`, from `docs/kidsgames-rules-update.patch`).
2. Open the [Firebase console for kidsgame-7a262](https://console.firebase.google.com/project/kidsgame-7a262/firestore) → **Firestore Database** → **Rules**.
3. Keep a copy of the current rules.
4. Replace all of the text with the **complete** Kids Games file. Click **Publish**.

Do not publish only the KidsChinese block: that removes the Kids Games rules.

What the KidsChinese block allows after the update (the role comes from `players/{uid}.code`):

| | YC / JY (child) | SL / CJ / 嬤 (parent) | Guest, others |
|---|---|---|---|
| Read, study and save own progress | ✓ | ✓ | ✗ |
| Read the children's progress | ✗ (own only) | ✓ (YC and JY) | ✗ |
| Read another parent's progress | — | ✗ | ✗ |
| Change display settings | own only | own, YC and JY | ✗ |
| Set a level | ✗ | own, YC and JY | ✗ |
| Reset progress | ✗ | own, YC and JY | ✗ |

The Kids Games rules are not changed.

**Done (2026-11-23): the rules update** for level 4, for parents who study, and for 嬤 (code `AMA`).
See [docs/2026-11-23_kidsgames-rules-update-handoff.md](../docs/2026-11-23_kidsgames-rules-update-handoff.md).

## 2. Set the levels

1. Open https://seanlin-larc.github.io/KidsChinese/ and sign in as **SL** with the Kids Games PIN.
2. The parent page shows YC and JY. Set each child's **Level** (程度).
   The levels are 學前 Starters, 初階 Beginner, 四年級 Grade 4 and 小學 Elementary (see README, "Levels").
   A parent sets their own level in **設定 Settings** (on their study page).
3. Sign out. Sign in as **YC**, do one round, and check that the stars stay after a reload.

## 3. Add 嬤 (grandma, code AMA)

嬤 is a parent: she sees the parent page for YC and JY, and she studies with her own cards and level
(a test player). The page shows 嬤; the code in Firebase is `AMA`. Do the steps in this order.

1. **Authentication user — done (2026-11-22).** `ama@kidsgames.invalid`, Email/Password.
2. **PIN.** The password must be the 6-digit PIN: the sign-in page has a number pad with 6 digits only.
   If you typed another password when you made the user, set a PIN on your computer, in the Kids Games
   repo `admin/` folder:

   ```bash
   node reset-pin.mjs --player ama
   ```

   You type the PIN at a hidden prompt. Do not write the PIN in a chat, a note or a file.
3. **Firestore `players/{uid}` document.** Without it, the rules do not know who she is.
   1. Firebase console → **Authentication** → **Users**. In the row `ama@kidsgames.invalid`, point at the
      **User UID** and click the copy icon. (The list shows only the start of the UID.)
   2. Firebase console → **Firestore Database** → **Data** → collection **players** → **Add document**.
   3. **Document ID:** paste the UID. Do not use **Auto-ID**.
   4. Add one field: name `code`, type **string**, value `AMA` (capital letters). Click **Save**.
   5. Check: the new document sits next to the other five, and each has one field `code`.
4. **Rules update — done (2026-11-23).** Kids Games `main` has it (commit `b91fa7b`), and Sean published
   the complete file (section 1).
5. **Put the new KidsChinese page online:** merge the KidsChinese branch to `main`. GitHub Pages updates
   in about a minute. (Steps 4 and 5 can be in either order. 嬤 can use the site only after both.)
6. **Test** on a phone or iPad:
   1. Open the site. Tap **嬤** (next to SL and CJ), then type her PIN.
   2. The parent page shows YC and JY.
   3. Tap **練習 Study**. Do one round. Reload the page: the stars stay.
   4. Tap ⚙️ **Settings** and pick her own level. Tap **家長 Parent** to go back.

Notes:

- 嬤 is not on the Kids Games sign-in page. To add her there, add one line to `shared/session.js` in the
  Kids Games repo (a Kids Games change; not done).
- Her data is `chinese/AMA`. Firestore makes it at her first answer. SL and CJ cannot see her progress,
  and she cannot see theirs.
- The wrong-PIN lock (10 tries, 30 minutes) works for 嬤 the same as for the others.

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

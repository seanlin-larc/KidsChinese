# KidsChinese 的 Firebase 設定

> 本文是 [SETUP.md](SETUP.md) 的繁體中文翻譯（2026-11-23）。兩者不一致時，以英文版為準。

KidsChinese 使用 **Kids Games** 的 Firebase 專案（`kidsgame-7a262`）和它的帳號。
沒有新專案、沒有新帳號，也沒有新的 PIN 碼。

| 已完成（Kids Games） | 還要做 |
|---|---|
| 帳號 YC、JY、SL、CJ、Guest（`<code>@kidsgames.invalid`），PIN 碼 = 密碼 | 發布規則更新（第 1 節） |
| 含有代號的 `players/{uid}` 文件 | 加入嬤（第 3 節） |
| 含有 KidsChinese 區塊的規則（2026-11-23） | 用 SL 登入，設定每個孩子的程度（第 2 節） |
| API 金鑰限制：`https://seanlin-larc.github.io/*`、`http://localhost:8000/*` | |
| Kids Games repo 裡的 `admin/reset-pin.mjs` | |

## 1. 發布規則（一次，以及每次規則修改後）

兩個網站的規則在**同一個檔案**：**Kids Games** repo 的 `firebase/firestore.rules`。
KidsChinese 的部分是接近結尾的「KidsChinese flash cards」區塊（`chinese` 集合）。

1. 確認 Kids Games 的檔案有這個區塊。狀態（2026-11-23）：Sean 已發布合併後的檔案，
   而且 Kids Games 的 `main` 有相同的檔案（commit `c7cd314`，來自 `docs/kidsgames-kidschinese-rules.patch`）。
2. 開啟 [kidsgame-7a262 的 Firebase 主控台](https://console.firebase.google.com/project/kidsgame-7a262/firestore) → **Firestore Database** → **Rules**。
3. 保留一份目前規則的副本。
4. 用**完整的** Kids Games 檔案取代所有文字。按 **Publish**。

不要只發布 KidsChinese 區塊：那樣會刪除 Kids Games 的規則。

更新後 KidsChinese 區塊允許的事（角色來自 `players/{uid}.code`）：

| | YC / JY（孩子） | SL / CJ / 嬤（家長） | Guest、其他 |
|---|---|---|---|
| 讀取、練習和儲存自己的進度 | ✓ | ✓ | ✗ |
| 讀取孩子的進度 | ✗（只限自己） | ✓（YC 和 JY） | ✗ |
| 讀取另一位家長的進度 | — | ✗ | ✗ |
| 修改顯示設定 | 只限自己 | 自己、YC 和 JY | ✗ |
| 設定程度 | ✗ | 自己、YC 和 JY | ✗ |
| 重設進度 | ✗ | 自己、YC 和 JY | ✗ |

Kids Games 的規則沒有改變。

**待辦（2026-11-23）：規則更新**，用於第 4 級、家長練習，以及嬤（代號 `AMA`）。
見 [docs/2026-11-23_kidsgames-rules-update-handoff_zhtw.md](../docs/2026-11-23_kidsgames-rules-update-handoff_zhtw.md)。
發布之前：不能設定第 4 級，SL 和 CJ 看得到家長頁但不能練習，嬤會看到「Cannot read progress」。

## 2. 設定程度

1. 開啟 https://seanlin-larc.github.io/kidsChinese/，用 **SL** 和 Kids Games 的 PIN 碼登入。
2. 家長頁會顯示 YC 和 JY。設定每個孩子的**程度**（Level）。
   程度有 學前 Starters、初階 Beginner、四年級 Grade 4 和 小學 Elementary（見 README 的「程度」）。
   小學 Elementary 需要規則更新（第 1 節）。
   家長在自己練習頁的 **設定 Settings** 裡設定自己的程度。
3. 登出。用 **YC** 登入，做一回合，重新整理後確認星星還在。

## 3. 加入嬤（奶奶，代號 AMA）

嬤是家長：她看得到 YC 和 JY 的家長頁，也可以用自己的字卡和程度練習
（測試玩家）。頁面顯示「嬤」；Firebase 裡的代號是 `AMA`。請依照順序做。

1. **Authentication 使用者——已完成（2026-11-22）。** `ama@kidsgames.invalid`，電子郵件／密碼。
2. **PIN 碼。** 密碼必須是 6 位數的 PIN 碼：登入頁的數字鍵盤只能輸入 6 位數字。
   如果建立使用者時輸入了別的密碼，請在你的電腦上、Kids Games repo 的 `admin/` 資料夾設定 PIN 碼：

   ```bash
   node reset-pin.mjs --player ama
   ```

   PIN 碼在隱藏的提示中輸入。不要把 PIN 碼寫在對話、筆記或檔案裡。
3. **Firestore 的 `players/{uid}` 文件。** 沒有這份文件，規則就不知道她是誰。
   1. Firebase 主控台 → **Authentication** → **Users**。在 `ama@kidsgames.invalid` 那一列，指向
      **User UID**，按複製圖示。（清單只顯示 UID 的開頭。）
   2. Firebase 主控台 → **Firestore Database** → **Data** → 集合 **players** → **Add document**。
   3. **Document ID：** 貼上 UID。不要用 **Auto-ID**。
   4. 加一個欄位：名稱 `code`，類型 **string**，值 `AMA`（大寫）。按 **Save**。
   5. 檢查：新文件和其他五份放在一起，每份都有一個 `code` 欄位。
4. **發布規則更新**（第 1 節）。先由有 `kidsgames` 推送權限的對話套用 patch 並合併（見交接文件）。
   然後從 Kids Games 的 `main` 發布**完整的**檔案。
5. **讓新的 KidsChinese 頁面上線——已完成（2026-11-23）：** 分支已合併到 `main`。GitHub Pages 大約一分鐘後更新。
   （第 4、5 步的順序不拘。兩步都完成後，嬤才能使用網站。）
6. **在手機或 iPad 上測試：**
   1. 開啟網站。點 **嬤**（在 SL 和 CJ 旁邊），輸入她的 PIN 碼。
   2. 家長頁會顯示 YC 和 JY。
   3. 點 **練習 Study**。做一回合。重新整理頁面：星星還在。
   4. 點 ⚙️ **Settings**，選她自己的程度。點 **家長 Parent** 回到家長頁。

注意：

- 嬤不在 Kids Games 的登入頁上，以後也不加（Sean 的決定，2026-11-23）。
- 她的資料在 `chinese/AMA`。Firestore 會在她第一次作答時建立。SL 和 CJ 看不到她的進度，
  她也看不到他們的。
- PIN 碼錯誤鎖定（10 次、30 分鐘）對嬤和其他人一樣有效。

## 共用登入：須知

- **同一台裝置上，兩個網站共用一次登入。** 孩子登入 Kids Games，也就登入了
  KidsChinese，反過來也一樣。**在一個網站登出，另一個網站也會登出。**
- **Guest：** Guest 從 Kids Games 登入時，KidsChinese 顯示「Not for this account」和
  登出按鈕。它不會自己把 Guest 登出。
- **PIN 碼錯誤鎖定**（`kg-lock`）是共用的：兩個網站的錯誤次數合併計算。
- **忘記 PIN 碼：** 使用 Kids Games repo 裡的 `admin/reset-pin.mjs`。新的 PIN 碼兩個網站都能用。
- **取消帳號的存取權：** 在主控台刪除它的 `players/{uid}` 文件。之後該帳號
  兩個網站都不能用。
- **離線：** 裝置第一次登入之後，KidsChinese 不需要網路也能用。答案先存在
  裝置上，稍後再送出。（Kids Games 有自己的 48 小時離線借出機制。）
- **費用：** 兩個網站共用 Firestore 免費額度（每天 50,000 次讀取和 20,000 次寫入）。
  兩個孩子只用掉一小部分。見 https://firebase.google.com/pricing。

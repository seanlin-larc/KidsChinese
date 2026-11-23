# KidsChinese 的 Firebase 設定

> 本文是 [SETUP.md](SETUP.md) 的繁體中文翻譯（2026-11-23）。兩者不一致時，以英文版為準。

KidsChinese 使用 **Kids Games** 的 Firebase 專案（`kidsgame-7a262`）和它的帳號。
沒有新專案、沒有新帳號，也沒有新的 PIN 碼。

| 已完成（Kids Games） | 還要做 |
|---|---|
| 帳號 YC、JY、SL、CJ、Guest（`<code>@kidsgames.invalid`），PIN 碼 = 密碼 | 發布含有 KidsChinese 區塊的規則（見下方） |
| 含有代號的 `players/{uid}` 文件 | 用 SL 登入，設定每個孩子的程度 |
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

KidsChinese 區塊允許的事（角色來自 `players/{uid}.code`）：

| | YC / JY（學習者） | SL / CJ（家長） | Guest、其他 |
|---|---|---|---|
| 讀取自己的進度 | ✓ | — | ✗ |
| 讀取另一個學習者的進度 | ✗ | ✓（兩人） | ✗ |
| 儲存答案、星星、連續天數 | 只限自己 | ✗ | ✗ |
| 修改顯示設定（拼音、英文） | 只限自己 | ✓ | ✗ |
| 設定學習者的程度 | ✗ | ✓ | ✗ |
| 重設學習者的進度 | ✗ | ✓ | ✗ |

Kids Games 的規則沒有改變。

待辦（2026-11-23）：第 4 級（小學 Elementary）的規則修改。見
`docs/2026-11-23_kidsgames-level4-handoff_zhtw.md`。

## 2. 設定程度

1. 開啟 https://seanlin-larc.github.io/KidsChinese/，用 **SL** 和 Kids Games 的 PIN 碼登入。
2. 家長頁會顯示 YC 和 JY。設定每個孩子的**程度**（Level）。
   程度有 學前 Starters、初階 Beginner、四年級 Grade 4 和 小學 Elementary（見 README 的「程度」）。
   小學 Elementary 需要 `docs/2026-11-23_kidsgames-level4-handoff_zhtw.md` 裡的規則修改。
3. 登出。用 **YC** 登入，做一回合，重新整理後確認星星還在。

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

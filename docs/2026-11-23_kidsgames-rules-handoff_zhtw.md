# 交接：把 KidsChinese 規則加入 `kidsgames` repo

> 本文是 [2026-11-23_kidsgames-rules-handoff.md](2026-11-23_kidsgames-rules-handoff.md) 的繁體中文翻譯。兩者不一致時，以英文版為準。

**已完成（2026-11-23）。** Kids Games 的 `main` 已有這個 patch（`c7cd314`）；`firebase/firestore.rules` 的 SHA-256 是
`d5383d42…698d`。Commit `ccfd684` 修正了測試設定，所以直接執行 `npm test` 就能用（18 個全部通過）。
第 4 步的替代做法已經不需要了。

對象：**有權限推送到 `seanlin-larc/kidsgames`** 的新對話（Claude Code、Codex 或其他 agent）。
來源：KidsChinese 工作階段，2026-11-23。該工作階段無法推送到 `kidsgames`。

## 一句話說明任務

把準備好的 patch 套用到 `seanlin-larc/kidsgames` 的新分支，執行規則測試，推送分支，
只有在 Sean 要求時才合併到 `main`。

## 為什麼

- KidsChinese（https://seanlin-larc.github.io/KidsChinese/，repo `seanlin-larc/KidsChinese`）使用
  **Kids Games 的 Firebase 專案**（`kidsgame-7a262`）和 Kids Games 的帳號（Sean 的決定，2026-11-23）。
- 一個 Firestore 資料庫只有**一套**規則。所以 KidsChinese 的規則必須放在
  `kidsgames/firebase/firestore.rules`，也就是 Sean 在 Firebase 主控台發布的那個檔案。
- **Sean 已經發布了合併後的規則檔（2026-11-23）。** `kidsgames` repo 的 `main` 仍是
  舊檔案。如果現在有人從 `main` 發布檔案，KidsChinese 的規則會消失，孩子會看到
  「Cannot read progress」。這個任務讓 repo 和線上版本一致。

## 這個 patch 改了什麼（4 個檔案，Kids Games 規則不變）

| 檔案 | 修改 |
|---|---|
| `firebase/firestore.rules` | 在「Everything else stays locked」之前新增「KidsChinese flash cards」區塊，用於 `chinese` 集合。一行標頭註解。現有規則都沒有改 |
| `firebase/tests/kidschinese.rules.test.mjs` | 新檔案：這個區塊的 9 個模擬器測試 |
| `firebase/package.json` | `test` 會一個接一個執行兩個測試檔（`--test-concurrency=1`） |
| `README.md` | 新段落「KidsChinese uses this project」；儲存鍵表格多一列 |

規則摘要（角色來自 `players/{uid}.code`，和檔案其他部分相同）：

| | YC / JY（學習者） | SL / CJ（家長） | Guest、其他 |
|---|---|---|---|
| 讀取自己的 `chinese/{code}/…` | ✓ | — | ✗ |
| 讀取另一個學習者 | ✗ | ✓ | ✗ |
| 寫入卡片和摘要 | 只限自己 | ✗ | ✗ |
| 寫入偏好設定 | 只限自己 | ✓ | ✗ |
| 設定程度（`chinese/{code}`） | ✗ | ✓ | ✗ |
| 刪除卡片和摘要（重設） | ✗ | ✓ | ✗ |

## 檔案

- Patch（用 `git format-patch` 產生，一個 commit，基準 `8d4e80a` = 2026-11-23 的 `kidsgames` `main`）：
  https://raw.githubusercontent.com/seanlin-larc/KidsChinese/main/docs/kidsgames-kidschinese-rules.patch
- 同一個 patch 也在這個資料夾：`docs/kidsgames-kidschinese-rules.patch`。
- 套用 patch **之後**的 `firebase/firestore.rules` 的 SHA-256，也就是 Sean 發布的檔案：
  `d5383d4247fa34ea8eb34edd0d74efcea94722269e2461952c694a98c800698d`

## 步驟

1. Clone `seanlin-larc/kidsgames`。建立一個分支，例如 `claude/kidschinese-rules`。
2. 下載並套用 patch：

   ```bash
   curl -fsSLo /tmp/kc.patch https://raw.githubusercontent.com/seanlin-larc/KidsChinese/main/docs/kidsgames-kidschinese-rules.patch
   ```

   ```bash
   git am /tmp/kc.patch
   ```

   如果 `main` 在 `8d4e80a` 之後有變動而 `git am` 失敗，先執行 `git am --abort`，再用
   `git am -3 /tmp/kc.patch` 套用並解決衝突。每一條現有的 Kids Games 規則都要保持原樣。
3. 確認規則檔就是已發布的檔案：

   ```bash
   sha256sum firebase/firestore.rules
   ```

   結果必須是 `d5383d42…698d`（見上方）。如果 `main` 在 `8d4e80a` 之後改過規則，雜湊值會不同。
   這時請告訴 Sean：線上規則沒有那些 `main` 的修改，他必須發布新檔案。
4. 執行規則測試（需要 Java 11 以上）：

   ```bash
   cd firebase && npm install && npm test
   ```

   預期：**18 個全部通過**（9 個 Kids Games + 9 個 KidsChinese）。

   已知問題，`main` 本來就有（不是這個 patch 造成的）：使用 firebase-tools 14.21.0 時，`npm test` 可能停止並顯示
   `../firestore.rules is outside of project directory`，因為 `tests/firebase.json` 指向
   資料夾外面。2026-11-23 使用的替代做法（不要 commit 暫存檔）：

   ```bash
   sed 's#"../firestore.rules"#"firestore.rules"#' tests/firebase.json > firebase.tmp.json
   ```

   ```bash
   npx firebase emulators:exec --project demo-kidsgames --only firestore --config firebase.tmp.json "node --test --test-concurrency=1 tests/firestore.rules.test.mjs tests/kidschinese.rules.test.mjs"
   ```

   ```bash
   rm firebase.tmp.json firestore-debug.log
   ```

   要在另一個 commit 修正這個設定之前，先問 Sean。
5. 不要 commit `firebase/firestore-debug.log`（模擬器會寫這個檔；`.gitignore` 沒有列出它）。
6. 推送分支。**只有在 Sean 要求時才合併到 `main`**（`main` 是正式的 Kids Games 網站）。
   這個 patch 沒有改任何頁面，所以 Kids Games 網站不會改變。`sw.js` / `CACHE` 不需要修改。
7. 不要發布規則，也不要修改 Firebase 設定。規則由 Sean 自己發布。

## 2026-11-23 的結果（KidsChinese 工作階段）

- 合併後檔案的 `kidsgames` 規則測試：18 個全部通過，跑了兩次（模擬器、Java、firebase-tools 14.21.0）。
- 用這些規則執行 KidsChinese 端對端測試（真正的 Firebase SDK 13.0.0、Auth + Firestore 模擬器、
  `players/{uid}` 文件）：6 個全部通過，包括「Guest 被拒絕，而且沒有被登出」。
- 沒有測試：正式專案和真正的 PIN 碼。

## 這個修改對 Kids Games 的影響（不需要動作，但最好知道）

- **同一台裝置上兩個網站共用一次登入**（同一個專案、同一個 apiKey、同一個網站）。在
  KidsChinese 登出，也會登出 Kids Games。
- KidsChinese 絕不自己登出帳號。從 Kids Games 登入的 Guest 在那裡會看到「Not for this
  account」。
- KidsChinese 會讀寫 Kids Games 的裝置鍵 `kg-lock`（相同格式）和 `kg-lastPlayer`。
  兩個網站的 PIN 碼錯誤次數合併計算。
- `admin/reset-pin.mjs`：沒有改變。新的 PIN 碼兩個網站都能用。
- 刪除 `players/{uid}` 文件，現在會同時取消該帳號對兩個網站的存取權。

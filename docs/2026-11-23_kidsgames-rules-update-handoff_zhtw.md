# 交接：KidsChinese 的 Kids Games 規則更新（第 4 級、家長也練習、嬤）

> 本文是 [2026-11-23_kidsgames-rules-update-handoff.md](2026-11-23_kidsgames-rules-update-handoff.md) 的繁體中文翻譯。兩者不一致時，以英文版為準。

**狀態（2026-11-23）：已完成。** Kids Games 的 `main` 已有這個 patch（commit `b91fa7b`），
Sean 也已發布完整的規則檔。見文末的「結果」。
本文取代先前只有第 4 級的交接文件。

對象：**有權限推送到 `seanlin-larc/kidsgames`** 的對話（Claude Code、Codex 或其他 agent），
以及負責發布規則的 Sean。

## 一句話說明任務

把本 repo 的 `docs/kidsgames-rules-update.patch` 套用到 `seanlin-larc/kidsgames` 的新分支，執行規則測試，
推送分支，在 Sean 要求時合併到 `main`，然後由 Sean 發布完整的檔案。

## 為什麼

KidsChinese 程式有三項改變。目前發布的規則三項都會拒絕：

1. **第 4 級（小學 Elementary）。** 規則只接受 `level in [1, 2, 3]`。
2. **家長也練習。** SL、CJ 和嬤可以用自己的進度和自己的程度練習字卡（測試玩家）。
   規則只允許 YC 和 JY 有進度。
3. **新家長：嬤（奶奶），代號 `AMA`，** 帳號 `ama@kidsgames.invalid`。她的權限和 SL、CJ 相同。

新規則發布之前，SL 和 CJ 仍然看得到家長頁，但沒有「練習 Study」按鈕，
並會看到一則關於這次更新的說明。嬤會看到「Cannot read progress」。YC 和 JY 不受影響。
第 4 級在那之前也會失敗（「Could not set the level」）。

## 這個 patch 改了什麼（3 個檔案）

| 檔案 | 修改 |
|---|---|
| `firebase/firestore.rules` | 只改 KidsChinese 區塊：`level in [1, 2, 3, 4]`；新的 `kcParentCode()` = SL、CJ、AMA；`kcSelf()` 包含家長；新的 `kcManages()` = 家長管理（孩子或自己）。標頭註解加上 AMA |
| `firebase/tests/kidschinese.rules.test.mjs` | 測試帳號加入 AMA；允許第 4 級、拒絕第 5 級；新測試：家長用自己的資料練習，且不能讀取或修改另一位家長的資料 |
| `README.md` | 「KidsChinese uses this project」：SL、CJ 和 AMA 是家長；家長也練習；AMA 不在 Kids Games 的登入頁上 |

修改後，家長可以做的事：

| | 自己的資料 | YC / JY 的資料 | 另一位家長的資料 |
|---|---|---|---|
| 讀取 | ✓ | ✓ | ✗ |
| 儲存卡片答案和摘要 | ✓ | ✗ | ✗ |
| 設定程度 | ✓ | ✓ | ✗ |
| 修改偏好設定 | ✓ | ✓ | ✗ |
| 重設進度 | ✓ | ✓ | ✗ |

Kids Games 的規則都沒有改。`players/{uid}` 仍然只能在主控台修改。Kids Games 的頁面不變：
AMA 沒有加入 `shared/session.js`，所以她不在 Kids Games 的登入頁上。

## 步驟

1. 在 `kidsgames` 的 checkout 中：`git checkout -b kidschinese-rules-update origin/main`。
2. `git apply ../KidsChinese/docs/kidsgames-rules-update.patch`（這個 patch 以 `main` 的 `ccfd684` 為基準）。
3. `cd firebase && npm install && npm test`。預期 19 個全部通過。
4. 推送分支。只有在 Sean 要求時才合併到 `main`。
5. 由 Sean 發布完整的檔案：見 KidsChinese 的 `firebase/SETUP_zhtw.md` 第 3 節。

## 在 KidsChinese 工作階段中已檢查（2026-11-23）

- 套用 patch 後的 Kids Games 規則測試：19 個全部通過。
- 用套用 patch 後的規則執行 KidsChinese 端對端測試：7 個全部通過。其中包括嬤：登入、家長頁、
  一回合練習存到 `chinese/AMA`，以及她自己的程度。

## 結果（2026-11-23）

- 一個有推送權限的 Claude Code 工作階段把 patch 原樣套用到 `seanlin-larc/kidsgames`。
- Kids Games 規則測試：19 個全部通過。KidsChinese 的 `tests/accounts.test.mjs` 用新規則檔也通過。
- Kids Games 的 `main`：從 `ccfd684` 快轉到 `b91fa7b`。Kids Games 的頁面沒有改變。
- Sean 已在 Firebase 主控台發布 Kids Games `main` 的完整檔案。
- 附帶影響：Kids Games 規則讓每個有 `players/{uid}` 文件的帳號都有家人權限。
  所以 AMA 也能讀取 Kids Games 的成績、儲存自己的結果，和 Guest 一樣。
  她不能修改拼圖庫（只有 SL 和 CJ 可以）。

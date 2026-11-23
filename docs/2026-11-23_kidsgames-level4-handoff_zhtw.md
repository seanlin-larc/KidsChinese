# 交接：在 Kids Games 規則中允許第 4 級

> 本文是 [2026-11-23_kidsgames-level4-handoff.md](2026-11-23_kidsgames-level4-handoff.md) 的繁體中文翻譯。兩者不一致時，以英文版為準。

**狀態（2026-11-23）：尚未完成。** KidsChinese 的工作階段無法推送到 `seanlin-larc/kidsgames`。

對象：**有權限推送到 `seanlin-larc/kidsgames`** 的對話（Claude Code、Codex 或其他 agent），
以及負責發布規則的 Sean。

## 一句話說明任務

把本 repo 的 `docs/kidsgames-level4-rules.patch` 套用到 `seanlin-larc/kidsgames` 的新分支，執行
規則測試，推送分支，在 Sean 要求時合併到 `main`，然後由 Sean 發布完整的檔案。

## 為什麼

KidsChinese 現在有 4 個程度：1 學前 Starters、2 初階 Beginner、3 四年級 Grade 4、4 小學 Elementary。
`kidsgames/firebase/firestore.rules` 的 KidsChinese 區塊只接受 `level in [1, 2, 3]`。
所以家長無法設定 小學 Elementary：Firestore 拒絕寫入，頁面顯示
「Could not set the level」。第 1–3 級不需要這個修改就能用。

## 這個 patch 改了什麼（2 個檔案）

| 檔案 | 修改 |
|---|---|
| `firebase/firestore.rules` | `kcLevelOk`：`d.level in [1, 2, 3]` → `d.level in [1, 2, 3, 4]`。一行註解加上「(1–4)」 |
| `firebase/tests/kidschinese.rules.test.mjs` | 家長可以設定第 4 級。不合法的值從 4 改成 5 |

沒有其他規則改變。Kids Games 的規則不變。

## 步驟

1. 在 `kidsgames` 的 checkout 中：`git checkout -b kidschinese-level4 origin/main`。
2. `git apply ../KidsChinese/docs/kidsgames-level4-rules.patch`（這個 patch 以 `main` 的 `ccfd684` 為基準）。
3. `cd firebase && npm install && npm test`。預期 18 個全部通過。
4. 推送分支。只有在 Sean 要求時才合併到 `main`。
5. Sean：開啟 `kidsgame-7a262` 的 Firebase 主控台 → Firestore Database → Rules，用 `main` 上**完整的**
   `firebase/firestore.rules` 取代所有文字，按 **Publish**。
   不要只發布 KidsChinese 區塊。

## 在 KidsChinese 工作階段中已檢查（2026-11-23）

- 套用 patch 後的 Kids Games 規則測試：18 個全部通過（在 `kidsgames/firebase` 執行 `npm test`）。
- 用套用 patch 後的規則，執行 KidsChinese 端對端測試，由家長把 JY 設為第 4 級：6 個全部通過。
- 用目前的規則（`ccfd684`）執行 KidsChinese 端對端測試：6 個全部通過。

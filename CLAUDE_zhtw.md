# CLAUDE.md — KidsChinese（繁體中文翻譯）

> 本文是 [CLAUDE.md](CLAUDE.md) 的繁體中文翻譯（2026-11-23），給家長閱讀。Claude 依英文版 `CLAUDE.md` 工作；兩者不一致時，以英文版為準。

修改任何東西之前，先讀這個檔案和 `README.md`。

## 這是什麼

給 YC 和 JY 的繁體中文字卡（答案有注音和拼音），SL 和 CJ 有家長控制功能。
放在 GitHub Pages 上的靜態網頁（`main` / 根目錄 = 正式網站）。使用 **Kids Games** 的 Firebase 專案
（`kidsgame-7a262`）和帳號；登入一次就能使用兩個網站。資料在 Firestore 的 `chinese` 集合。擁有者不是專業程式設計師：程式碼要簡單、好讀。
沒有建置步驟，沒有框架。只用 HTML、CSS 和 ES 模組。

## 硬性規定

- **這個 repo 是公開的。** 絕不 commit PIN 碼、密碼、服務帳戶金鑰或 token。
- **絕不輸入或索取真正的 PIN 碼。** 測試使用模擬器和假的 PIN 碼。
- **Firestore 規則放在 Kids Games repo**（`firebase/firestore.rules`，「KidsChinese」區塊），因為
  資料庫只有一套規則。在那裡測試（`cd firebase && npm test`，Kids Games 和 KidsChinese 一起測）。
  由家長在 Firebase 主控台發布**完整**檔案。不要部署任何東西到 Firebase。不要
  修改 Firebase 或 Google Cloud 設定；說明要改什麼、為什麼。
- 絕不自動登出帳號：登入狀態和 Kids Games 共用。
- 帳號改變時，`js/accounts.js` 和 Kids Games 規則要一起改（`tests/accounts.test.mjs` 會檢查）。
- 只有在被要求時才推送到 `main`。`main` 是正式網站。

## 程式碼規定

- 所有 Firebase 程式碼都在 `js/firebase/auth.js`。其他檔案沒有 Firebase 程式碼。
- Firebase 網頁 SDK 13.0.0，來自 `https://www.gstatic.com/firebasejs/13.0.0/`（和 Kids Games、Reads 相同）。
- 只用相對連結。和 Kids Games 共用的鍵：`kg-lock`、`kg-lastPlayer`。自己的新鍵以 `kc-` 開頭。
- 讀音採用臺灣（教育部）讀音。拼音用聲調數字儲存；注音由程式產生。
- 詞的程度由它的字決定（`js/data/levels.js`，教育部字頻表）。`npm test` 會檢查。
- 手機優先：在 390 px 寬度檢查，點擊目標至少 44 px。

## 測試（每次 commit 前執行）

- 修改詞語後執行 `npm test`（單元測試）和 `npm run crosscheck`。
- 修改登入、儲存、家長頁或規則後，執行 `cd firebase && npm run e2e`（本 repo 旁邊要有 Kids Games 的 checkout）。

## 寫作

文件、註解和訊息接近 ASD-STE100 簡化技術英文：短句、主動語態、
一個詞只表示一個意思。

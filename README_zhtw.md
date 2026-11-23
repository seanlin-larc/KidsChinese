# 學中文字卡（KidsChinese）

> 本文是 [README.md](README.md) 的繁體中文翻譯（2026-11-23）。兩者不一致時，以英文版為準。

給在週六中文學校學華語的孩子用的字卡。
字卡顯示一個**繁體字**詞語（2–3 個字）。
孩子先讀，再翻面，用**注音**和**拼音**核對答案。

這是放在 GitHub Pages 上的靜態網頁（不需要建置步驟）。登入和儲存進度使用 **Kids Games** 的 Firebase 專案和帳號。

## 功能

- **28 個主題卡組（情境），共 1,635 個詞**：家人、問候、人物、動物、食物、顏色、身體、健康、家裡、學校、知識、天氣、大自然、時間、數字、動作、說話、心情、形容、常用詞、地方、交通、買東西、玩樂、藝術、節日、故事、國家社會。
- **4 個程度，依字來分**（見[程度](#程度)）：學前 Starters（929 個詞）、初階 Beginner（再加 583 個）、四年級 Grade 4（再加 97 個）、小學 Elementary（再加 26 個）。第 1、2 級的 1000 個字，每一個字都至少出現在一個詞裡。
- **答案面採用臺灣課本格式**：注音直排在每個字的右邊，拼音在下面。英文意思可以關掉。
- **聆聽按鈕**：瀏覽器把詞語唸出來。裝置有臺灣華語（zh-TW）語音時，就用臺灣語音。
- **Kids Games 帳號和 PIN 碼**：YC 和 JY 是學習者，SL、CJ 和嬤（奶奶）是家長，家長也可以用自己的進度練習。Guest 不能使用 KidsChinese。在同一台裝置上，登入一次就可以同時使用 Kids Games 和 KidsChinese。PIN 碼連續錯 10 次（兩個網站合計），該帳號在這台裝置上鎖住 30 分鐘。
- **進度跟著孩子走**：答案、星星和連續天數存在 Firestore，所以 iPad 和電腦之間會同步。第一次登入之後，離線也能用，答案會在連線後送出。
- **家長頁**（只有 SL、CJ、嬤）：設定每個孩子的程度，查看每個孩子的進度（已學會的詞、星星、連續天數、各卡組進度、最常答錯的詞），以及重設孩子的進度。Firestore 規則在伺服器上強制執行：孩子不能改自己的程度、不能重設進度，也看不到另一個孩子的資料。
- **間隔複習**（Leitner 盒子法）。孩子會的卡，會在 1、3、7、14、30 天後再出現。答錯的卡，同一回合稍後再出現，隔天也會再出現。
- **獎勵**：每答對一題得一顆星，全對的回合有額外獎勵，每天目標 10 張卡，每個卡組有 0–3 顆星。

## 程度

一個程度就是一組字。字來自臺灣教育部依使用頻率排列的字表（教育部字庫 5021 字，字頻順序）。每一個程度都包含較低的程度。

| 程度 | 字 | 目前詞數 | 每個字都用到了嗎？ |
|---|---|---|---|
| 1 學前 Starters | 最常用的 600 字（第 1–600 字） | 929 | 是 |
| 2 初階 Beginner | 第 1–1000 字 | 929 + 583 | 是 |
| 3 四年級 Grade 4 | 第 1–1800 字 | + 97 | 還沒有 |
| 4 小學 Elementary | 第 1–3000 字 | + 26 | 還沒有 |

- 一個詞的程度，是包含它所有字的最低程度。`npm test` 會檢查。
  例：香蕉是第 4 級，因為「蕉」是第 1883 字。
- `npm test` 也會檢查第 1、2 級的每一個字都有詞用到。有兩個字不必用到：台和裏。教育部辭典把它們列為「臺」和「裡」的異體字，字卡使用「臺」和「裡」。
- 字表在 `js/data/levels.js`。

資料來源（2026-11-23 查核）：

- sidonie.ca 字卡的 600 字（https://sidonie.ca/diy-chinese-flash-cards/）就是教育部字表的前 600 字。該網站說兩者順序相同。
  該網站的拼音版 PDF 有 4 個字重複（心雨手變），而且缺少「便兩新首」，所以本程式使用教育部字表。
- 兩份 Google 試算表（「一二年級常用 1000 字」和「一至四年級常用 1800 字」）**沒有採用**。
  它們和教育部字表不一致：1000 字表沒有「上 生 用 什 長」；1800 字表沒有「一 是 我 人」，而且其中 513 個字不在最常用的 3000 字之內（例如「佞 饕 匭」）。另外，1000 字表中有 376 個字不在 1800 字表裡。
- **常用不等於「對孩子容易」。** 這份字表統計的是一般文章裡的字。所以香蕉（banana）和阿姨（aunt）是第 4 級，而政府（government）是第 2 級。

第 3、4 級還需要更多詞。新增方法見[新增或修改詞語](#新增或修改詞語)。

**第 4 級需要修改規則。** 目前已發布的 Kids Games 規則只接受第 1–3 級。在 [docs/2026-11-23_kidsgames-rules-update-handoff_zhtw.md](docs/2026-11-23_kidsgames-rules-update-handoff_zhtw.md) 的修改發布之前，家長不能選 小學 Elementary（頁面會顯示「Could not set the level」）。

Firestore 裡的程度數字不變，但名稱在 2026-11-23 改了：
1 初級 → 學前，2 中級 → 初階，3 高級 → 四年級。原本是第 2 級的孩子，現在是 初階 Beginner（1000 字）。

## 第一次設定：Firebase

KidsChinese 使用 Kids Games 專案（`kidsgame-7a262`），所以帳號、PIN 碼和 API 金鑰都已經有了。
只剩一步：發布含有 KidsChinese 區塊的 Kids Games 規則檔，然後設定程度。
見 [firebase/SETUP_zhtw.md](firebase/SETUP_zhtw.md)。規則發布之前，網站會顯示「Cannot read progress」。

狀態（2026-11-23）：Sean 已發布合併後的規則。Kids Games 的 `main` 有相同的檔案（commit `c7cd314`）。

## 帳號和帳號管理

| 帳號 | 角色 | 可以做什麼 |
|---|---|---|
| YC、JY | 學習者 | 練習、查看和儲存自己的進度、修改自己的顯示設定 |
| SL、CJ、嬤（代號 `AMA`） | 家長 | 家長頁：設定程度、查看兩個孩子的進度、重設進度。也可以用自己的進度和程度練習（測試玩家） |
| Guest | — | 不能做任何事。頁面會請 Guest 登出 |

- 帳號就是 Kids Games 帳號，`<code>@kidsgames.invalid`（Firebase 電子郵件／密碼登入）。PIN 碼就是密碼（和 Kids Games 相同）。由 Firebase 檢查。程式碼裡沒有任何 PIN 碼。
- 頁面顯示每個帳號的 `name`（`AMA` 顯示「嬤」，其他帳號顯示代號）。
- 家長要練習、以及使用嬤的帳號，需要 2026-11-23 的 Kids Games 規則更新
  （見 [firebase/SETUP_zhtw.md](firebase/SETUP_zhtw.md) 第 1、3 節）。
- 頁面從電子郵件取得代號和角色（`js/accounts.js`），所以離線也能運作。Firestore 規則用 Kids Games 的 `players/{uid}` 文件檢查角色。刪除這份文件，就能取消該帳號對兩個網站的存取權。
- **兩個網站共用一次登入**（同一個專案、同一個網站）。在一個網站登出，另一個網站也會登出。共用 iPad 時，換另一個孩子之前請先登出。
- **PIN 碼錯誤鎖定：** 連續 10 次錯誤，該帳號在這台裝置上鎖住 30 分鐘。鎖定用的 `kg-lock` 和 Kids Games 共用。這個檢查只在網頁上；Firebase 也會減慢大量錯誤嘗試。
- **忘記 PIN 碼：** 使用 Kids Games repo 裡的 `admin/reset-pin.mjs`。
- **離線：** 每台裝置第一次登入需要網路。之後 Firebase 不需要網路就能恢復登入，Firestore 會把答案存在裝置上，等連線再送出。沒有網路時會顯示「⚠️ Offline」。

Firestore 資料：

共用的 Kids Games 資料庫中的 `chinese` 集合：

```
chinese/{code}                  程度（家長寫入）
chinese/{code}/data/summary     星星、連續天數、今天的張數（帳號本人寫入）
chinese/{code}/data/prefs       拼音、英文、每回合張數、語音速度、avatar（不顯示）
chinese/{code}/cards/{cardId}   盒子、下次複習日、看過次數、答對次數（帳號本人寫入）
{code} = YC、JY、SL、CJ 或 AMA
```

這個集合的規則是 `kidsgames/firebase/firestore.rules` 裡的「KidsChinese」區塊。
KidsChinese 沒有自己的規則檔，因為一個 Firestore 資料庫只有一套規則。

## 在自己的電腦上執行

任何靜態檔案伺服器都可以。請用 8000 埠：API 金鑰只接受 `seanlin-larc.github.io` 和 `localhost:8000`。

```bash
python3 -m http.server 8000
```

然後開啟 http://localhost:8000。直接從磁碟開啟 `index.html` 不行，因為瀏覽器會擋住 `file://` 上的 ES 模組。

## 用 GitHub Pages 上線（免費）

1. 在 GitHub 開啟 **Settings → Pages**。
2. 把 **Source** 設為 *Deploy from a branch*。
3. 選擇分支 `main` 和資料夾 `/ (root)`，然後按 **Save**。
4. 大約一分鐘後，網站會在 `https://<your-user>.github.io/KidsChinese/`。

在 iPad 或手機上，用 **分享 → 加入主畫面** 取得 App 圖示。

## 重要限制

- **每台裝置第一次登入需要網路。** Firebase 程式碼從 `www.gstatic.com` 下載。
- **帳號功能之前儲存的進度**（只存在瀏覽器，0.1 版）沒有搬到 Firestore。
- **聆聽按鈕取決於裝置的語音。** iPad、Mac 和大多數 Android 裝置有華語語音。Windows 上如果找不到華語語音，請在系統設定加入「中文（繁體，台灣）」語音。設定畫面會告訴你有沒有可用的語音。
- **聲調是字典聲調。** 說話時的變調（例如三聲 + 三聲 → 二聲 + 三聲）不標示。這和大多數課本印注音的方式相同。

## 讀音採用臺灣（教育部）標準

注音課本採用臺灣教育部的讀音，所以本程式也一樣。
每個詞的拼音來自教育部辭典（教育部重編國語辭典修訂本）。
一個詞有兩種讀音時，字卡採用 `en` 所寫意思的讀音（例如「東西 dōng xi」= 物品）。
有些詞和大陸讀音不同。這些詞在資料裡有 `tw` 註記，字卡上有小小的「臺灣讀音」標籤。例子：

| 詞 | 臺灣（本程式採用） | 大陸 |
|---|---|---|
| 姊姊 | jiě jie（ㄐㄧㄝˇ ˙ㄐㄧㄝ） | zǐ zǐ；通常寫作「姐姐」（jiě jie） |
| 星期、星期一 | xīng qí | xīng qī |
| 垃圾 | lè sè | lā jī |
| 研究 | yán jiù | yán jiū |
| 微笑 | wéi xiào | wēi xiào |
| 機場、市場 | jī cháng、shì cháng | jī chǎng、shì chǎng |
| 流血 | liú xiě | liú xuè |
| 喜歡 | xǐ huān | xǐ huan |

有兩個詞刻意和辭典詞條不同：姊姊（課本讀 jiě jie）和它們（tā men）。
`tools/crosscheck.mjs` 會列出它們。

2026-11-23 有四個舊詞改成辭典讀音：對不起 duì bu qǐ、嘴巴 zuǐ ba、早上 zǎo shang 和晚上 wǎn shang（輕聲），以及機場 jī cháng。

如果老師教的讀音不同，請修改 `js/data/words.js` 裡那個詞的 `p` 值。

## 新增或修改詞語

編輯 `js/data/words.js`。每個詞的格式如下：

```js
{ w: '老虎', p: 'lao3 hu3', en: 'tiger', lv: 1 },
```

- `w`：繁體字的詞（2–3 個字）。
- `p`：帶聲調數字的拼音，每個字一個音節。輕聲用 `5`，ü 用 `v`（`lv4` = lǜ）。
- `en`：英文意思。
- `lv`：程度 1–4。必須是包含這個詞所有字的最低程度（見[程度](#程度)）。

不用輸入注音。程式會從 `p` 產生注音和聲調符號。

要新增主題，請加一個新的卡組物件，含 `id`、`name`、`en`、`icon` 和 `words`。
不要修改卡組的 `id`，也不要把詞搬到別的卡組：每張卡儲存的進度用的是卡組 id 和詞。

然後執行檢查：

```bash
npm install
```

```bash
npm test
```

```bash
npm run crosscheck
```

`npm test` 檢查：每個詞都是 2–3 個繁體字、每個字有一個有效的拼音音節、程度正確、第 1、2 級的字都有用到，以及每個詞只在一個卡組裡。它也測試注音轉換、複習排程、帳號清單，以及（當 Kids Games 的 checkout 在本 repo 旁邊，或設定了 `KIDSGAMES_RULES` 時）Kids Games 規則裡的學習者和家長代號是否相同。

修改詞語後，也請更新 `notes-with-llm` repo（在本 repo 旁邊）裡的詞表筆記：

```bash
node tools/export-notes.mjs ../notes-with-llm/projects/kidsChinese/words
```

`npm run crosscheck` 把你的拼音和教育部辭典比對（npm 套件 `@leonsilicon/moedict-data`，來自 g0v 萌典資料）。辭典裡有的詞，必須是辭典的讀音之一。辭典裡沒有的詞，每個字都必須是辭典裡該字的讀音之一。它印出的每一行都需要人工檢查。

### Firebase 測試

- **規則測試：** 在 Kids Games repo 執行 `cd firebase && npm test`。它同時測試 Kids Games 規則和 KidsChinese 區塊（`tests/kidschinese.rules.test.mjs`）。
- **端對端測試**（本 repo）：需要 Java 11 以上、含 Chromium 的 Playwright，以及在本 repo 旁邊的 Kids Games checkout（或 `KIDSGAMES_RULES=<firestore.rules 的路徑>`）。在 `firebase/` 資料夾：

  ```bash
  npm install
  ```

  ```bash
  npm run e2e
  ```

  它在無頭 Chromium 中，用真正的 Firebase SDK 執行真正的程式，連到 Auth 和 Firestore 模擬器，並套用 Kids Games 規則：拒絕 Guest（但不幫它登出）、PIN 碼錯誤、登入、一回合練習存到 Firestore、離線答案稍後送出、家長頁（設定程度、重設），以及 10 次 PIN 碼鎖定。
- 模擬器的專案 ID 是 `demo-kidsgames`，所以模擬器絕不會連到真正的專案。測試用的 PIN 碼只存在模擬器裡。
- 要手動對模擬器檢查，請開啟 `http://localhost:8000/?emulator`（只在 localhost 有效）。

## 專案結構

```
index.html               頁面外框
css/style.css            樣式（淺色和深色）
js/app.js                畫面：登入、學習者首頁、練習、設定、家長頁
js/accounts.js           五個帳號、名稱和角色（沒有 Firebase）
js/lock.js               裝置上的 PIN 碼錯誤鎖定（沒有 Firebase）
js/load.js               在時限內載入 Firebase 程式碼；目前誰登入（沒有 Firebase）
js/stuck.js              「The page did not load. Reload the page.」訊息
js/firebase/config.js    Firebase 網頁設定（Kids Games 專案）和 SDK 版本
js/firebase/auth.js      所有 Firebase 程式碼：登入、進度、家長控制
js/data/words.js         詞語卡組
js/data/levels.js        四個程度和 3000 個字
js/pinyin.js             拼音 → 注音和聲調符號
js/srs.js                間隔複習排程、星星、連續天數
js/speech.js             朗讀
firebase/SETUP.md        要在 Firebase 主控台發布什麼
firebase/tests/          端對端測試（模擬器、Kids Games 規則）
tests/                   單元測試（node --test）
tools/crosscheck.mjs     用教育部辭典檢查拼音
tools/export-notes.mjs   產生每個程度的字表和字卡筆記（notes-with-llm）
```

## 裝置儲存鍵

和 Kids Games 共用（同一個網站、同一組帳號）：`kg-lock`（PIN 碼錯誤次數）和 `kg-lastPlayer`（上次選的帳號）。KidsChinese 自己的新鍵以 `kc-` 開頭（目前沒有）。
Firebase 也把登入狀態和 Firestore 副本存在瀏覽器的 IndexedDB。

## 為什麼用間隔複習和自我測驗

- 把練習分散在好幾天，比同樣的練習一次做完，長期記憶更好。見 Cepeda 等人（2006）的統合分析，*Psychological Bulletin*：https://doi.org/10.1037/0033-2909.132.3.354
- 先試著回想答案再看（「先讀，再翻面」這一步），比再讀一次答案記得更好。見 Roediger 與 Karpicke（2006），*Psychological Science*：https://doi.org/10.1111/j.1467-9280.2006.01693.x

這裡的間隔（1、3、7、14、30 天）是常見的預設值，不是針對孩子測試過的最佳值。

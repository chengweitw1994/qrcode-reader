# Vendor 外部套件管理

外部瀏覽器套件集中放在 `src/vendor/`。每個套件使用獨立目錄，並在套件目錄下以版本號分開保存；升版時新增版本目錄，避免直接覆寫目前可用的檔案。

## @zxing/browser 0.2.1

- 來源：[npm 套件頁](https://www.npmjs.com/package/@zxing/browser/v/0.2.1)
- 授權：MIT；授權全文隨套件保存在 `src/vendor/zxing-browser/0.2.1/LICENSE`。
- 瀏覽器載入檔：`src/vendor/zxing-browser/0.2.1/zxing-browser.min.js`。
- 套件中繼資料：`src/vendor/zxing-browser/0.2.1/package.json`。
- SHA-256：記錄於 `src/vendor/manifest.json`，用來確認本機 bundle 是否遭到意外變更。
- 引用位置：`src/index.html` 的註解與 `<script>` 路徑需保持版本一致。

此版本的 UMD bundle 可直接提供 `window.ZXingBrowser.BrowserQRCodeReader`，不需要執行時載入 npm/CDN 依賴。

## 升版流程

1. 從官方套件頁或 release notes 確認要升級的**確切版本**與授權，不使用 `latest` 或版本範圍作為部署來源。
2. 下載該版本的 npm 套件，例如 `npm pack @zxing/browser@<版本號>`。
3. 將套件的 `umd/zxing-browser.min.js`、`LICENSE` 與 `package.json` 放到 `src/vendor/zxing-browser/<版本號>/` 新目錄。
4. 計算新 bundle 的 SHA-256，更新 `src/vendor/manifest.json`。
5. 更新 `src/index.html` 的外部套件註解與 script 路徑，並更新本文件中的版本資訊。
6. 確認 UMD bundle 仍輸出 `ZXingBrowser.BrowserQRCodeReader`，再驗證相機掃描與圖片掃描流程後才部署。
7. 新版確認可用後，再視需要移除舊版本目錄；保留舊版可供快速回復。

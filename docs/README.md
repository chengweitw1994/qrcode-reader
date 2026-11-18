# QR 讀值器

以手機後鏡頭掃描 QR Code，將讀到的原始內容顯示在頁面上，也可以匯入圖片掃描並複製結果。

## 目錄

- `src/`：網站入口 `index.html`、樣式 `styles.css` 與掃描程式 `app.js`。
- `src/vendor/`：依套件名稱與版本保存的外部瀏覽器套件。
- `docs/`：使用與部署說明。

## 使用方式

相機需要安全連線。部署網站時請使用 HTTPS，手機開啟網站後按「啟動手機相機」，並允許瀏覽器存取相機。掃描成功後，相機會停止，結果會顯示在頁面上。

本機預覽可在專案根目錄啟動靜態伺服器，並將 `src` 設為網站根目錄：

```powershell
python -m http.server 8000 --directory src
```

接著在同一台電腦開啟 `http://localhost:8000`。部署時也請將 `src` 設為網站發布目錄。手機實際使用時，請部署到 HTTPS 網址；一般區域網路 HTTP 網址無法保證瀏覽器會開放相機權限。

## 掃描方式

- 相機：使用 ZXing Browser 解碼器持續掃描；未指定鏡頭時會請瀏覽器優先選擇後鏡頭。
- 圖片：選擇含有 QR Code 的圖片，或將圖片拖曳到掃描預覽區。
- 結果：原始文字以純文字顯示，可複製；QR Code 中的網址不會自動開啟。

相機串流與圖片解碼都在瀏覽器本機處理。ZXing Browser 解碼器已隨網站放在 `src/vendor/`，不需在執行時連線到套件 CDN。外部套件版本、授權與升版流程記錄於 [vendor-dependencies.md](vendor-dependencies.md)。

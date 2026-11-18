"use strict";

(() => {
  const cameraButton = document.querySelector("#camera-button");
  const cameraButtonLabel = document.querySelector("#camera-button-label");
  const cameraStatus = document.querySelector("#camera-status");
  const cameraStatusLabel = document.querySelector("#camera-status-label");
  const cameraPreview = document.querySelector("#camera-preview");
  const clearButton = document.querySelector("#clear-button");
  const copyButton = document.querySelector("#copy-button");
  const copyButtonLabel = document.querySelector("#copy-button-label");
  const decodedResult = document.querySelector("#decoded-result");
  const decodedTime = document.querySelector("#decoded-time");
  const emptyResult = document.querySelector("#empty-result");
  const imagePicker = document.querySelector("#image-picker");
  const imagePreview = document.querySelector("#image-preview");
  const resultType = document.querySelector("#result-type");
  const resultValue = document.querySelector("#result-value");
  const scanFeedback = document.querySelector("#scan-feedback");
  const scannerStage = document.querySelector("#scanner-stage");
  const stageHint = document.querySelector("#stage-hint");
  const stagePromptTitle = document.querySelector("#stage-prompt-title");
  const stagePromptDescription = document.querySelector("#stage-prompt-description");
  const stageToplineLabel = document.querySelector("#stage-topline-label");
  const torchButton = document.querySelector("#torch-button");

  let reader = null;
  let scanControls = null;
  let scanActive = false;
  let torchEnabled = false;
  let currentValue = "";
  let previewUrl = "";

  const setCameraStatus = (label, state = "idle") => {
    cameraStatusLabel.textContent = label;
    cameraStatus.classList.toggle("is-active", state === "active");
    cameraStatus.classList.toggle("is-error", state === "error");
  };

  const setFeedback = (message = "") => {
    scanFeedback.textContent = message;
  };

  const setPrompt = (title, description) => {
    stagePromptTitle.textContent = title;
    stagePromptDescription.textContent = description;
  };

  const stopScanner = () => {
    scanActive = false;
    scannerStage.classList.remove("is-scanning");
    cameraPreview.hidden = true;
    cameraPreview.pause();
    cameraPreview.srcObject = null;
    torchEnabled = false;
    torchButton.setAttribute("aria-pressed", "false");
    torchButton.hidden = true;

    if (scanControls) {
      const controls = scanControls;
      scanControls = null;
      try {
        const stopped = controls.stop();
        if (stopped && typeof stopped.catch === "function") stopped.catch(() => {});
      } catch {
        // Tracks are also stopped by the browser when the page is closed.
      }
    }
  };

  const clearResult = () => {
    currentValue = "";
    resultValue.textContent = "";
    decodedResult.hidden = true;
    emptyResult.hidden = false;
    resultType.hidden = true;
    clearButton.hidden = true;
    copyButton.classList.remove("is-copied");
    copyButtonLabel.textContent = "複製內容";
  };

  const showResult = (value) => {
    stopScanner();
    currentValue = value;
    resultValue.textContent = value;
    decodedTime.textContent = new Intl.DateTimeFormat("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    emptyResult.hidden = true;
    decodedResult.hidden = false;
    resultType.hidden = false;
    clearButton.hidden = false;
    cameraButtonLabel.textContent = "掃描下一個";
    setCameraStatus("讀取成功");
    setPrompt("已讀取 QR Code", "內容已顯示在右側，可直接複製核對");
    stageToplineLabel.textContent = "已完成掃描";
    stageHint.textContent = "掃描結果已暫停相機";
    setFeedback("");
  };

  const friendlyCameraError = (error) => {
    if (!window.isSecureContext) {
      return "相機需要 HTTPS 網址才能使用。請以安全連線開啟此頁面，再允許瀏覽器使用相機。";
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      return "此瀏覽器無法存取相機。請改用最新版 Safari、Chrome 或 Edge，並以 HTTPS 開啟。";
    }

    if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
      return "尚未取得相機權限。請在瀏覽器網站設定中允許使用相機，再重新啟動掃描。";
    }

    if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
      return "找不到可用的相機，請確認裝置有相機並關閉其他正在使用相機的程式。";
    }

    if (error?.name === "NotReadableError" || error?.name === "TrackStartError") {
      return "相機目前無法啟動。請關閉正在使用相機的應用程式後再試一次。";
    }

    return "相機啟動失敗，請確認瀏覽器權限與 HTTPS 網址後再試一次。";
  };

  const ensureReader = () => {
    if (reader) return reader;

    const Reader = window.ZXingBrowser?.BrowserQRCodeReader;
    if (!Reader) {
      throw new Error("QR 掃描元件尚未載入，請確認網路連線後重新整理頁面。");
    }

    reader = new Reader();
    return reader;
  };

  const startCamera = async () => {
    setFeedback("");
    stopScanner();

    if (!window.isSecureContext) {
      setCameraStatus("需要 HTTPS", "error");
      setFeedback(friendlyCameraError());
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("無法使用相機", "error");
      setFeedback(friendlyCameraError());
      return;
    }

    try {
      const codeReader = ensureReader();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = "";
      }
      imagePreview.hidden = true;
      imagePreview.removeAttribute("src");
      scannerStage.classList.remove("has-image");
      cameraPreview.hidden = false;
      scanActive = true;
      cameraButtonLabel.textContent = "停止掃描";
      setCameraStatus("正在掃描", "active");
      setPrompt("正在啟動相機…", "請允許瀏覽器使用相機");
      stageToplineLabel.textContent = "相機啟動中";
      stageHint.textContent = "手機會優先使用後鏡頭";
      scannerStage.classList.add("is-scanning");

      const controls = await codeReader.decodeFromVideoDevice(undefined, cameraPreview, (result, error) => {
        if (result && scanActive) {
          showResult(result.getText());
          return;
        }

        const transientDecodeErrors = ["NotFoundException", "ChecksumException", "FormatException"];
        if (error && !transientDecodeErrors.includes(error.name) && scanActive) {
          setFeedback("相機暫時無法讀取，請將 QR Code 移入取景框並保持清晰。");
        }
      });

      scanControls = controls;
      if (!scanActive) {
        stopScanner();
        return;
      }

      cameraButtonLabel.textContent = "停止掃描";
      setCameraStatus("正在掃描", "active");
      setPrompt("對準 QR Code", "保持手機穩定，讀取到內容後會自動停止");
      stageToplineLabel.textContent = "即時相機預覽";
      stageHint.textContent = "對準 QR Code，保持穩定";
      if (typeof controls.switchTorch === "function") {
        torchButton.hidden = false;
      }
    } catch (error) {
      stopScanner();
      cameraButtonLabel.textContent = "重新啟動相機";
      setCameraStatus("相機未啟動", "error");
      setFeedback(error?.name === "Error" && error.message.includes("QR 掃描元件")
        ? error.message
        : friendlyCameraError(error));
      setPrompt("相機無法啟動", "請檢查相機權限、網路連線與 HTTPS 網址");
      stageToplineLabel.textContent = "等待相機連線";
      stageHint.textContent = "也可以改用圖片掃描";
    }
  };

  const toggleCamera = () => {
    if (scanActive) {
      stopScanner();
      cameraButtonLabel.textContent = currentValue ? "掃描下一個" : "啟動手機相機";
      setCameraStatus("相機已停止");
      setPrompt("掃描已暫停", "準備好時，可以重新啟動相機");
      stageToplineLabel.textContent = "相機預覽已暫停";
      stageHint.textContent = "按下按鈕繼續掃描";
      setFeedback("");
      return;
    }

    startCamera();
  };

  const scanImage = async (file) => {
    if (!file) return;

    setFeedback("");
    clearResult();
    stopScanner();
    cameraButtonLabel.textContent = "啟動手機相機";
    setCameraStatus("正在讀取圖片");
    stageToplineLabel.textContent = "圖片掃描";
    stageHint.textContent = "正在讀取本機圖片";
    setPrompt("正在讀取圖片…", "圖片只會在目前瀏覽器中處理");

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    imagePreview.src = previewUrl;
    imagePreview.hidden = false;
    cameraPreview.hidden = true;
    scannerStage.classList.add("has-image");

    try {
      const codeReader = ensureReader();
      await imagePreview.decode();
      const result = await codeReader.decodeFromImageElement(imagePreview);
      showResult(result.getText());
      stageToplineLabel.textContent = "圖片已完成掃描";
      stageHint.textContent = "掃描結果已顯示在右側";
    } catch (error) {
      setCameraStatus("未找到 QR Code", "error");
      setFeedback("這張圖片沒有讀到 QR Code。請選擇清晰、完整且未裁切的圖片，或直接開啟相機掃描。");
      setPrompt("沒有找到 QR Code", "換一張清晰、完整的圖片，或使用手機相機");
      cameraButtonLabel.textContent = "啟動手機相機";
      if (!window.ZXingBrowser?.BrowserQRCodeReader) {
        setFeedback("QR 掃描元件尚未載入。請確認網路連線後重新整理頁面再試。");
      }
    }
  };

  const copyValue = async () => {
    if (!currentValue) return;

    try {
      await navigator.clipboard.writeText(currentValue);
    } catch {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = currentValue;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();

      if (!copied) {
        setFeedback("無法自動複製。請選取結果文字後手動複製。");
        resultValue.focus();
        return;
      }
    }

    copyButtonLabel.textContent = "已複製";
    copyButton.classList.add("is-copied");
    setFeedback("QR Code 內容已複製到剪貼簿。");
  };

  const toggleTorch = async () => {
    if (!scanControls?.switchTorch) return;

    try {
      torchEnabled = !torchEnabled;
      await scanControls.switchTorch(torchEnabled);
      torchButton.setAttribute("aria-pressed", String(torchEnabled));
      torchButton.classList.toggle("is-torch-on", torchEnabled);
      torchButton.querySelector("span").textContent = torchEnabled ? "關閉補光" : "補光";
    } catch {
      torchEnabled = false;
      torchButton.setAttribute("aria-pressed", "false");
      torchButton.classList.remove("is-torch-on");
      torchButton.querySelector("span").textContent = "補光";
      setFeedback("此裝置目前無法切換補光燈。");
    }
  };

  cameraButton.addEventListener("click", toggleCamera);
  imagePicker.addEventListener("change", (event) => {
    const [file] = event.currentTarget.files || [];
    if (file) scanImage(file);
    event.currentTarget.value = "";
  });
  copyButton.addEventListener("click", copyValue);
  clearButton.addEventListener("click", () => {
    clearResult();
    setCameraStatus("相機未啟動");
    cameraButtonLabel.textContent = "啟動手機相機";
    setPrompt("準備好開始掃描了嗎？", "將 QR Code 放在取景框內，系統會自動讀取");
    stageToplineLabel.textContent = "相機預覽";
    stageHint.textContent = "對準 QR Code，保持穩定";
    setFeedback("");
  });
  torchButton.addEventListener("click", toggleTorch);

  scannerStage.addEventListener("dragover", (event) => {
    event.preventDefault();
    scannerStage.classList.add("is-dragging");
  });
  scannerStage.addEventListener("dragleave", () => {
    scannerStage.classList.remove("is-dragging");
  });
  scannerStage.addEventListener("drop", (event) => {
    event.preventDefault();
    scannerStage.classList.remove("is-dragging");
    const file = [...(event.dataTransfer?.files || [])].find((item) => item.type.startsWith("image/"));
    if (file) scanImage(file);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && scanActive) {
      stopScanner();
      cameraButtonLabel.textContent = "繼續掃描";
      setCameraStatus("相機已暫停");
      setPrompt("掃描已暫停", "返回頁面後，可按按鈕繼續掃描");
      stageToplineLabel.textContent = "相機預覽已暫停";
    }
  });
  window.addEventListener("pagehide", stopScanner);

  if (!window.isSecureContext) {
    setCameraStatus("需要 HTTPS", "error");
    setFeedback("手機相機需要 HTTPS 網址。部署後請使用 https:// 網址開啟此頁面。");
  }
})();

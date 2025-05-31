chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "capture") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      sendResponse(dataUrl);
    });
    return true;
  }

  if (msg.action === "downloadZip") {
    (async () => {
      const zip = new JSZip();
      msg.images.forEach((dataUrl, i) => {
        const base64 = dataUrl.split(",")[1];
        zip.file(`page_${String(i).padStart(4, '0')}.png`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const filename = `${msg.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;
      chrome.downloads.download({
        url,
        filename,
        saveAs: true
      });
    })();
  }
});

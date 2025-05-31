window.addEventListener("click", async (e) => {
  if (true) {
    if (window._bookwalkerCaptureRunning) return;
    window._bookwalkerCaptureRunning = true;

    createLoader();

    let lastDataURL = null;
    let count = 0;
    const max = 3000;
    const captured = [];

    while (count < max) {
      // Get the canvas element
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        alert('Canvas element not found!');
        break;
      }

      // Convert canvas to PNG data URL
      const dataUrl = canvas.toDataURL('image/png');

      if (dataUrl === lastDataURL) break;
      lastDataURL = dataUrl;
      captured.push(dataUrl);

      // Simulate click to turn page
      const target = document.elementFromPoint(50, window.innerHeight / 2);
      if (target) target.click();

      await new Promise(res => setTimeout(res, 1000));
      count++;
    }

    const title = document.title || 'bookwalker_pages';
    chrome.runtime.sendMessage({ action: "downloadZip", images: captured, title });

    removeLoader();
    window._bookwalkerCaptureRunning = false;
  }
}, { once: true });

function createLoader() {
  const loader = document.createElement('div');
  loader.id = 'capture-loader-overlay';
  Object.assign(loader.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    fontSize: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '9999999',
    userSelect: 'none',
    pointerEvents: 'all'
  });
  loader.innerHTML = `
    <div>
      <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
      Capturing pages, please wait...
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
      }
    </style>
  `;
  document.body.appendChild(loader);
}

function removeLoader() {
  const loader = document.getElementById('capture-loader-overlay');
  if (loader) loader.remove();
}

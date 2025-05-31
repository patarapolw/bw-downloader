const viewer = document.querySelector("#viewer");

let lastDataURL = null;
const captured = [];
let isStarted = false;
let isEnded = false;

window.addEventListener("click", async (e) => {
  if (isEnded) return;
  if (!viewer.classList.contains("rightmost")) {
    isStarted = true;
  }

  if (isStarted) {
    const isNew = await capturePage();

    if (viewer.classList.contains("leftmost")) return;
    if (!isNew) return;

    const title = document.title || "bookwalker_pages";
    chrome.runtime.sendMessage({
      action: "downloadZip",
      images: captured,
      title,
    });
    isEnded = true;
  }
});

async function capturePage() {
  createLoader();
  console.log(`Capturing page ${captured.length + 1}...`);

  const dataUrl = await chrome.runtime.sendMessage({ action: "capture" });
  const isNew = lastDataURL !== dataUrl;

  if (isNew) {
    lastDataURL = dataUrl;
    captured.push(dataUrl);
  }

  await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for page transition
  removeLoader();

  return isNew;
}

function createLoader() {
  const loader = document.createElement("div");
  loader.id = "capture-loader-overlay";
  Object.assign(loader.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    fontSize: "2rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "9999999",
    userSelect: "none",
    pointerEvents: "all",
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
  const loader = document.getElementById("capture-loader-overlay");
  if (loader) loader.remove();
}

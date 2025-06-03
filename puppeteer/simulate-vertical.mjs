//@ts-check

import fs from "fs";

import puppeteer from "puppeteer-core";

import { remoteDebuggingPort } from "./chrome.mjs";

const browser = await puppeteer.connect({
  browserURL: `http://localhost:${remoteDebuggingPort}`,
  defaultViewport: null, // Use the default viewport size
});

try {
  const tabs = await browser.pages();
  const tab = tabs.find((t) => {
    const { host } = new URL(t.url());
    return host.endsWith(".bookwalker.jp") && host.startsWith("viewer");
  });

  if (!tab) {
    throw new Error("No suitable tab found for BookWalker viewer.");
  }

  const title = await tab.title();
  const folderName =
    "out/" +
    title.replace("【期間限定無料】", "").replace(/[\s/\\?<>:"|*]/g, ""); // Replace invalid characters for folder names
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName, { recursive: true });
  }

  const getPage = async () => {
    const pageSliderCounterText = await tab
      .$("#pageSliderCounter")
      .then((h) => h && h.evaluate((el) => el.textContent));
    if (!pageSliderCounterText) {
      throw new Error("Page slider counter not found.");
    }

    return pageSliderCounterText.split("/").map(Number);
  };
  const totalPages = (await getPage())[1];

  const existingPages = fs
    .readdirSync(folderName)
    .map((file) => Number(file.split("_of_")[0]));
  const downloadedPages = [...existingPages];

  while (downloadedPages.length < totalPages) {
    await tab.$$("canvas.default").then(async (canvases) => {
      let downloadedImageCount = 0;
      /** @type {typeof canvases[0] | null} */
      let c = null;
      for (const canvas of canvases) {
        c = canvas;
        await canvas.scrollIntoView();

        // Get the page number from the canvas element's parent ID
        // This is more reliable the pageSliderCounter
        // as it directly relates to the canvas being rendered
        const canvasPage = await canvas.evaluate((c) => {
          if (!c.parentElement || !c.parentElement.id) return null;
          return Number(c.parentElement.id.replace("wideScreen", "")) + 1;
        });

        if (!canvasPage) {
          console.warn("Canvas does not have a valid page number.");
          continue; // Skip if the canvas does not have a valid page number
        }
        if (downloadedPages.includes(canvasPage)) {
          console.log(`Page ${canvasPage} already downloaded, skipping.`);
          continue; // Skip if this page has already been downloaded
        }

        // Wait for the canvas to be fully rendered
        await tab.waitForNetworkIdle();
        const b64 = await canvas.evaluate(
          (c) => c.toDataURL("image/png").split(",")[1]
        );

        const filename = `${folderName}/${canvasPage}_of_${totalPages}.png`;
        fs.writeFileSync(filename, Buffer.from(b64, "base64"));
        console.log(`Saved page ${canvasPage} of ${totalPages}`);

        downloadedImageCount++;
        downloadedPages.push(canvasPage);
      }
    });
    await tab.mouse.wheel({ deltaY: 1000 }); // Scroll down to load more canvases

    const start = +new Date();
    await tab.waitForNetworkIdle();
    const elapsed = +new Date() - start;
    if (elapsed < 10) break; // If it took less than 10ms, we assume no new pages were loaded
  }
} finally {
  await browser.disconnect();
}

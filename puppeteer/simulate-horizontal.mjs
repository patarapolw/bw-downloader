import fs from "node:fs";
import { URL } from "node:url";

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
      .then((h) => h.evaluate((el) => el.textContent));

    return pageSliderCounterText.split("/").map(Number);
  };

  while (true) {
    const [page, pageCount] = await getPage();

    let pageRange = `${page}`;
    if (page > 1 && page % 2 !== 0) {
      // If the page is odd, we take the previous page as well
      // except for the first page
      pageRange = `${page - 1}-${page}`;
    }

    const filename = `${folderName}/(${pageRange})_of_${pageCount}.png`;
    if (!fs.existsSync(filename)) {
      // Manually resize the viewport to minimize white space
      await tab.screenshot({ path: filename });
      // await sharp(await tab.screenshot())
      //   .trim()
      //   .toFile(filename);
      console.log(`Saved page ${pageRange} of ${pageCount}`);
    }

    if (page >= pageCount) break;

    tab.mouse.click(100, 500); // Click to turn the page

    const start = new Date();
    await tab.waitForNetworkIdle();

    const elapsed = new Date() - start;
    const minWaitTime = 200; // Minimum wait time in milliseconds
    if (elapsed < minWaitTime) {
      await new Promise((resolve) =>
        setTimeout(resolve, minWaitTime - elapsed)
      );
    }
  }
} finally {
  await browser.disconnect();
}

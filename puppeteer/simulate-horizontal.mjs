import fs from "node:fs";
import { URL } from "node:url";

import puppeteer from "puppeteer-core";
import sharp from "sharp";

import { remoteDebuggingPort } from "./chrome.mjs";

puppeteer
  .connect({
    browserURL: `http://localhost:${remoteDebuggingPort}`,
    defaultViewport: null, // Use the default viewport size
  })
  .then(async (browser) => {
    const tabs = await browser.pages();
    const tab = tabs.find((t) => {
      const { host } = new URL(t.url());
      return host.endsWith(".bookwalker.jp") && host.startsWith("viewer");
    });

    const title = await tab.title();
    try {
      fs.mkdirSync(`out/${title}`, { recursive: true });
    } catch (err) {}

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

      const filename = `out/${title}/(${pageRange})_of_${pageCount}.png`;
      if (!fs.existsSync(filename)) {
        await sharp(await tab.screenshot())
          .trim()
          .toFile(filename);
        console.log(`Saved page ${pageRange} of ${pageCount}`);
      }

      // Last page for odd pageCount is pageCount
      // while last page for even pageCount is pageCount - 1
      if (pageCount % 2) {
        if (page >= pageCount) break;
      } else {
        if (page >= pageCount - 1) break;
      }

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

    browser.disconnect();
  });

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

    const [page, pageCount] = await getPage();

    let pageNumber = page;

    while (pageNumber < pageCount - 2) {
      const pageRange =
        pageNumber === 1 ? "1" : `${pageNumber}-${pageNumber + 1}`;
      const filename = `out/${title}/(${pageRange})_of_${pageCount}.png`;
      if (!fs.existsSync(filename)) {
        await sharp(await tab.screenshot())
          .trim()
          .toFile(filename);
        console.log(`Saved page ${pageRange} of ${pageCount}`);
      }

      tab.mouse.click(100, 500); // Click to turn the page

      const start = new Date();
      await tab.waitForNetworkIdle();

      const elapsed = new Date() - start;
      const minWaitTime = 1000; // Minimum wait time in milliseconds
      if (elapsed < minWaitTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minWaitTime - elapsed)
        );
      }

      const [newPage] = await getPage();
      if (newPage === pageNumber) continue;
      pageNumber = newPage;
    }
  });

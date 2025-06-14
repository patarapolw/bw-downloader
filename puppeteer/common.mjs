//@ts-check

import fs from "node:fs";
import { URL } from "node:url";

import puppeteer from "puppeteer-core";

export const remoteDebuggingPort = 9222;

/**
 * @typedef {{
 *  browser: import('puppeteer-core').Browser,
 *  title: string,
 *  folderName: string,
 *  tab: import('puppeteer-core').Page
 * }} Context
 *
 * @param {(o: Context) => Promise<string>} fn
 * @param {string} [targetURL]
 * @returns
 */
export async function runInPuppeteer(fn, targetURL = process.argv[2]) {
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${remoteDebuggingPort}`,
    defaultViewport: null, // Use the default viewport size
  });

  try {
    while (true) {
      const tabs = await browser.pages();
      const tab = tabs.find((t) => {
        const tabURL = t.url();
        if (targetURL === tabURL) return true; // Allow direct URL matching

        const { host } = new URL(t.url());
        return host.endsWith(".bookwalker.jp") && host.startsWith("viewer");
      });

      if (!tab) {
        console.error("No suitable tab found for BookWalker viewer.");
        return;
      }

      const title = await tab.title();
      console.log(`Processing: ${title}`);
      const folderName =
        "out/" +
        title
          .replace(/\p{Z}/gu, "")
          .replace("【期間限定無料】", "")
          .replace("【期間限定無料お試し版】", "")
          .replace("【期間限定試し読み増量】", "")
          .replace("【合本版】", "")
          .replace(/[\s/\\?<>:"|*]/g, ""); // Replace invalid characters for folder names
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }

      // await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for the page to load

      const pageSlider = await tab.$("#pageSlider.show");
      if (pageSlider) {
        // const uiSliderHandle = await pageSlider.$(".ui-slider-handle");
        // if (uiSliderHandle) {
        //   const rect = await uiSliderHandle.evaluate((el) => {
        //     if (!(el instanceof HTMLElement)) return;
        //     if (el.style.left === "100%") return null; // Already at the rightmost position

        //     const { width, height, left, top } = el.getBoundingClientRect();
        //     return { width, height, left, top };
        //   });
        //   if (rect) {
        //     await tab.mouse.click(
        //       rect.left + rect.width - 10, // Click slightly to the right of the handle
        //       rect.top + rect.height / 2
        //     ); // Click slightly to the right of the handle
        //     console.log("Clicked the slider handle to close the page slider.");
        //   }
        // }

        await tab.waitForFunction(
          () => !document.querySelector("#pageSlider.show")
        );
      }

      targetURL = await fn({ browser, title, folderName, tab });

      if (!targetURL) {
        console.log("No more volumes to process.");
        break;
      }
    }
  } finally {
    await browser.disconnect();
  }
}

/**
 *
 * @param {import('puppeteer-core').Page} tab
 * @returns
 */
export async function getPageCount(tab) {
  const pageSliderCounterText = await tab
    .$("#pageSliderCounter")
    .then((h) => h && h.evaluate((el) => el.textContent));
  if (!pageSliderCounterText) {
    throw new Error("Page slider counter not found.");
  }

  const [page, total] = pageSliderCounterText.split("/").map(Number);
  return {
    page,
    total,
  };
}

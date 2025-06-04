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
 * @param {(o: Context) => Promise<boolean>} fn
 * @returns
 */
export async function runInPuppeteer(fn) {
  const browser = await puppeteer.connect({
    browserURL: `http://localhost:${remoteDebuggingPort}`,
    defaultViewport: null, // Use the default viewport size
  });

  try {
    while (true) {
      const tabs = await browser.pages();
      const tab = tabs.find((t) => {
        const tabURL = t.url();
        if (process.argv[2] === tabURL) return true; // Allow direct URL matching

        const { host } = new URL(t.url());
        return host.endsWith(".bookwalker.jp") && host.startsWith("viewer");
      });

      if (!tab) {
        console.error("No suitable tab found for BookWalker viewer.");
        return;
      }

      const title = await tab.title();
      const folderName =
        "out/" +
        title.replace("【期間限定無料】", "").replace(/[\s/\\?<>:"|*]/g, ""); // Replace invalid characters for folder names
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }

      const hasNext = await fn({ browser, title, folderName, tab });

      if (!hasNext) {
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

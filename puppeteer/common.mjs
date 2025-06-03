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
 * @param {(o: Context) => Promise<void>} fn
 * @returns
 */
export async function runInPuppeteer(fn) {
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

    return await fn({ browser, title, folderName, tab });
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

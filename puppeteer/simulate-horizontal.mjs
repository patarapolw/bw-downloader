import puppeteer from "puppeteer-core";

import { remoteDebuggingPort } from "./chrome.mjs";

puppeteer
  .connect({
    browserURL: `http://localhost:${remoteDebuggingPort}`,
    defaultViewport: null, // Use the default viewport size
  })
  .then(async (browser) => {
    const tabs = await browser.pages();
    const tab = tabs[0]; // Use the last tab opened

    const [page, pageCount] = (
      await tab
        .$("#pageSliderCounter")
        .then((h) => h.evaluate((el) => el.textContent))
    )
      .split("/")
      .map(Number);

    if (page !== 1) {
      throw new Error(`Expected page 1, but found page ${page}.`);
    }

    const waitForReader = (delay = 200) =>
      new Promise((resolve) => setTimeout(resolve, delay));

    await waitForReader();

    let pageNumber = 1;
    while (pageNumber < pageCount) {
      tab.mouse.click(100, 500); // Click to turn the page
      await tab.waitForNetworkIdle();
      await waitForReader();

      pageNumber += 2; // double page increase because of horizontal layout
    }
  });

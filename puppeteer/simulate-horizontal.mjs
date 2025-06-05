//@ts-check

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { getPageCount, runInPuppeteer } from "./common.mjs";

/**
 * @type {Parameters<typeof import('./common.mjs').runInPuppeteer>[0]}
 */
export async function simulateHorizontal({ tab, folderName }) {
  while (true) {
    const { page, total: pageCount } = await getPageCount(tab);

    let pageRange = `${page}`;
    if (page > 1 && page % 2 !== 0) {
      // If the page is odd, we take the previous page as well
      // except for the first page
      pageRange = `${page - 1}-${page}`;
    }

    /** @type {`${string}.png`} */
    const filename = `${folderName}/(${pageRange})_of_${pageCount}.png`;
    if (!fs.existsSync(filename)) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for .loading elements to appear if needed
      await tab.waitForFunction(() => {
        return Array.from(document.querySelectorAll(".loading")).every((el) => {
          const style = window.getComputedStyle(el);
          return style.visibility === "hidden" || style.display === "none";
        });
      });

      // Manually resize the viewport to minimize white space
      await tab.screenshot({ path: filename });
      // await sharp(await tab.screenshot())
      //   .trim()
      //   .toFile(filename);
      console.log(`Saved page ${pageRange} of ${pageCount}`);
    }

    await tab.mouse.click(100, 500); // Click to turn the page
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for the page to turn

    if (page >= pageCount) break;
  }

  const iframeSelector = "#endOfBook iframe";
  await tab.waitForSelector(iframeSelector, { visible: true });

  const iframe = await tab.$(iframeSelector);
  if (!iframe) return ""; // No iframe found, no next volume

  const frame = await iframe.contentFrame();

  // Click the "Next Volume" button if it exists
  const nextVolumeButton = await frame.$(".btn-reading-next a");
  if (!nextVolumeButton) {
    console.log("No 'Next Volume' button found.");
    return ""; // No next volume button, no next volume
  }

  await Promise.all([
    tab.waitForNavigation({ waitUntil: "networkidle0" }),
    nextVolumeButton.click(),
  ]);

  return tab.url();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runInPuppeteer(simulateHorizontal);
}

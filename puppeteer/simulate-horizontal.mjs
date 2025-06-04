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
      // Manually resize the viewport to minimize white space
      await tab.screenshot({ path: filename });
      // await sharp(await tab.screenshot())
      //   .trim()
      //   .toFile(filename);
      console.log(`Saved page ${pageRange} of ${pageCount}`);
    }

    if (page >= pageCount) break;

    tab.mouse.click(100, 500); // Click to turn the page

    const start = +new Date();
    await tab.waitForNetworkIdle();

    const elapsed = +new Date() - start;
    const minWaitTime = 200; // Minimum wait time in milliseconds
    if (elapsed < minWaitTime) {
      await new Promise((resolve) =>
        setTimeout(resolve, minWaitTime - elapsed)
      );
    }
  }

  // TODO: go to next volume if available
  return false;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runInPuppeteer(simulateHorizontal);
}

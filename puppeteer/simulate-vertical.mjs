//@ts-check

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { getPageCount, runInPuppeteer } from "./common.mjs";

/**
 * @type {Parameters<typeof import('./common.mjs').runInPuppeteer>[0]}
 */
export async function simulateVertical({ tab, folderName }) {
  const { total: totalPages } = await getPageCount(tab);

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

        const filename = `${folderName}/${String(canvasPage).padStart(
          String(totalPages).length,
          "0"
        )}_of_${totalPages}.png`;

        // Manually resize the viewport to minimize white space
        fs.writeFileSync(filename, Buffer.from(b64, "base64"));
        // await sharp(Buffer.from(b64, "base64")).trim().toFile(filename);

        console.log(`Saved page ${canvasPage} of ${totalPages}`);

        downloadedImageCount++;
        downloadedPages.push(canvasPage);
      }
    });
    await tab.mouse.wheel({ deltaY: 1000 }); // Scroll down to load more canvases
    await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for a short time to allow the page to load more canvases
  }

  // TODO: go to next volume if available
  return "";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runInPuppeteer(simulateVertical);
}

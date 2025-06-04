//@ts-check

import { fileURLToPath } from "node:url";

import { runInPuppeteer } from "./puppeteer/common.mjs";
import { simulateHorizontal } from "./puppeteer/simulate-horizontal.mjs";
import { simulateVertical } from "./puppeteer/simulate-vertical.mjs";

/**
 * @type {Parameters<typeof import('./puppeteer/common.mjs').runInPuppeteer>[0]}
 */
export async function simulate(o) {
  const canvases = await o.tab.$$("canvas.default");
  if (canvases.length === 0) {
    return await simulateHorizontal(o);
  } else {
    return await simulateVertical(o);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runInPuppeteer(simulate);
}

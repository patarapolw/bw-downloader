//@ts-check

import { fileURLToPath } from "node:url";

import { runInPuppeteer } from "./common.mjs";
import { simulateHorizontal } from "./simulate-horizontal.mjs";
import { simulateVertical } from "./simulate-vertical.mjs";

/**
 * @type {Parameters<typeof import('./common.mjs').runInPuppeteer>[0]}
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

import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const remoteDebuggingPort = 9222;

const userDataDir =
  process.env.PUPPETEER_USER_DATA_DIR || resolve("out/.puppeteer");
const executablePath =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    mkdirSync(userDataDir, { recursive: true });
  } catch (err) {}

  spawn(
    executablePath,
    [
      `--remote-debugging-port=${remoteDebuggingPort}`,
      `--user-data-dir=${userDataDir}`,
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
    {
      stdio: "inherit",
    }
  );
}

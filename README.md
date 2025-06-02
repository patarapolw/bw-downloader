# Vertical scroll

Only `browser-vertical.js` and `server.mjs` is required for now.

Run the server with `node ./server.mjs`.

Copy `browser-vertical.js` to JavaScript console (tested in Chrome). Original source code from https://github.com/ChristopherFritz/BookWalker-Screenshot-Simulator

Horizontal Screenshot Simulator may be possible, but it seems challenging to make the page scroll...

**One book** at a time. It also may be required to keep the tab active and visible.

# Horizontal scroll

Run `node ./puppeteer/chrome.mjs` and login to Bookwalker. Open the tab ready.

Run `node ./puppeteer/simulate-horizontal.mjs` without closing Chrome.

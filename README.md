# Vertical scroll

Only `browser-vertical.js` and `server.mjs` is required for now.

Run the server with `node ./server.mjs`.

Copy `browser-vertical.js` to JavaScript console (tested in Chrome). Original source code from https://github.com/ChristopherFritz/BookWalker-Screenshot-Simulator

Horizontal Screenshot Simulator may be possible, but it seems challenging to make the page scroll...

_One book_ at a time. It also may be required to keep the tab active and visible.

# Horizontal scroll

Run `node ./puppeteer/chrome.mjs`. It will open a programmable Chrome window. Use that to login to Bookwalker. Open the viewer tab ready.

Run `node ./puppeteer/simulate-horizontal.mjs` without closing the viewer tab and Chrome.

// Use the volume name in the file name when downloading.  If the volume name includes a character not supported by your filesystem, you can manually enter something here.
const volumeName = document.title;

// Delay time in miliseconds.  If you get blank images, increase this number and try again.  The higher the number, the slower the volume will take to fully download.
const delayTime = 1000;

// Do not modify code beyond this line unless you know what you are doing.

// Function for delaying code for a set amount of time.
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Track which images have already been downloaded.  This prevents downloading the same image multiple times.
const downloadedPages = [];

const getPage = () => {
  // Get the page number from the canvas's parent element's ID.
  return Number(
    document.querySelector("#pageSliderCounter").textContent.split("/")[0]
  );
};

// Download a single image from a canvas.
async function DownloadPage(canvas) {
  if (downloadedPages.includes(canvas.parentElement.id)) {
    return;
  }

  const page = getPage();

  await fetch("http://localhost:3000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: volumeName,
      page,
      total: pageCount,
      data: canvas.toDataURL("image/png"),
    }),
  });

  console.log(`Downloaded ${page} of ${pageCount} from "${volumeName}".`);

  // Remember that this image has been downloaded.
  downloadedPages.push(canvas.parentElement.id);
}

// Determine how many pages are expected.
const pageCount = Number(
  document.querySelector("#pageSliderCounter").textContent.split("/")[1]
);

const existingPages = new Set(
  await fetch("http://localhost:3000/" + volumeName)
    .then((response) => response.json())
    .then((data) => data.pages)
);

// Loops through canvases until all expected images have downloaded.
while (downloadedPages.length < pageCount) {
  // Grab all available canvases.
  const canvases = document.querySelectorAll("canvas.default");

  // Track how many images are downloaded this iteration.
  let downloadedImageCount = 0;
  for (let canvas of canvases) {
    canvas.scrollIntoView();

    if (downloadedPages.includes(canvas.parentElement.id)) {
      continue;
    }

    // Wait for the page number to render.
    await delay(100);

    const p = getPage();
    console.log(`Loading page ${p} of ${pageCount} from "${volumeName}"...`);

    if (existingPages.has(p)) {
      continue;
    }

    // Wait for image to load.
    await delay(delayTime);
    await DownloadPage(canvas);
    downloadedImageCount += 1;
  }

  // If no images were downloaded, then likely all images are downloaded, and the loop can be exited.  This situation shouldn't occur, but is here just in case.
  if (0 == downloadedImageCount) {
    console.log("Downloading complete!");
    break;
  }
}

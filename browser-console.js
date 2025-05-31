const volumeName = document.title;

window.addEventListener("click", async () => {
  if (!document.querySelector("#viewer").className.includes("cursor")) return;

  await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for page transition

  const [page, total] = document
    .querySelector("#pageSliderCounter")
    .textContent.trim()
    .split("/");
  console.log(`Capturing page ${page} of ${total} from "${volumeName}"...`);

  await fetch("http://localhost:3000/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: volumeName,
      page,
      total,
      data: document.querySelector("canvas:not(.dummy)").toDataURL("image/png"),
    }),
  });

  console.log(`Downloaded ${page} of ${total} from "${volumeName}".`);
});

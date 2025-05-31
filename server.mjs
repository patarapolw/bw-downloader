import Fastify from "fastify";
import cors from "@fastify/cors";

import fs from "fs";

const fastify = Fastify({
  logger: true,
  bodyLimit: 104857600, // 100 MB
});

await fastify.register(cors, {
  // put your options here
});

fastify.get("/:title", async (request, reply) => {
  const { title } = request.params;

  try {
    return {
      pages: fs
        .readdirSync(`out/${title}`)
        .map((file) => Number(file.split("_of_")[0])),
    };
  } catch (err) {
    return { pages: [] };
  }
});

fastify.post("/", async (request, reply) => {
  const { title, page, total, data } = request.body;

  try {
    fs.mkdirSync(`out/${title}`, { recursive: true });
  } catch (err) {}

  const filePath = `out/${title}/${String(page).padStart(
    String(total).length,
    "0"
  )}_of_${total}.png`;

  dataURLToFile(data, filePath);

  return { hello: "world" };
});

// Run the server!
try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

function dataURLToFile(dataURL, filePath) {
  const parts = dataURL.split(";base64,");
  const mimeType = parts[0].split(":")[1];
  const base64Data = parts[1];

  const buffer = Buffer.from(base64Data, "base64");

  fs.writeFileSync(filePath, buffer);
}

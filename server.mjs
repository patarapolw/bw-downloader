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

// Declare a route
fastify.post("/", async function handler(request, reply) {
  const { title, page, total, data } = request.body;

  try {
    fs.mkdirSync(`out/${title}`);
  } catch (err) {}

  const filePath = `out/${title}/page_${page.padStart(
    total.length,
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

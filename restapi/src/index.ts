import "dotenv/config";
import fastify from "fastify";
import { SeedData } from "./seed-data";

async function main() {
  /** Prepare database */
  await SeedData();

  /** Prepare Fastify */
  const host = process.env.HOST ? String(process.env.HOST) : "localhost";
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  const server = fastify();

  server.get("/health", async () => {
    return "OK";
  });

  server.listen({ host, port }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}

main();

import fastifySwagger from "@fastify/swagger";
import "dotenv/config";
import fastify from "fastify";
import { SeedData } from "./seed-data";
import { StudentHandler } from "./student";

async function main() {
  /** Prepare database */
  await SeedData();

  /** Prepare Fastify */
  const host = process.env.HOST ? String(process.env.HOST) : "localhost";
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  const server = fastify();
  let doc = "(openapi.yaml not loaded)";

  // Enable Swagger documentation
  await server.register(fastifySwagger, {
    openapi: {
      info: { title: "Student Attendance API", version: "1.0.0" },
      servers: [{ url: `http://${host}:${port}` }],
    },
  });

  server.get(
    "/health",
    {
      schema: {
        operationId: "health",
      },
    },
    async () => {
      return "OK";
    }
  );

  server.get(
    "/openapi.yaml",
    { schema: { operationId: "openapi" } },
    async () => {
      return doc;
    }
  );

  await server.register(StudentHandler, { prefix: "/students" });

  await server.ready();
  doc = server.swagger({ yaml: true });
  console.log("🚀 ~ file: index.ts:37 ~ main ~ doc:", doc);

  server.listen({ host, port }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
    console.log(server.printRoutes());
  });
}

main();

import "dotenv/config";
import { createOpenAPIChain } from "langchain/chains";

export default async function main(question: string) {
  // const openapi = await fetchOpenApi();
  const chain = await createOpenAPIChain("http://localhost:3001/openapi.yaml");
  const result = await chain.run(question);

  console.log({ result });
}

(async () => {
  await main(`find all students in homeroom 7. How many students are there?`);
})();

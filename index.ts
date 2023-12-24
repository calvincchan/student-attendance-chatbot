import "dotenv/config";
import { createOpenAPIChain } from "langchain/chains";

export default async function main(question: string) {
  const chain = await createOpenAPIChain("http://localhost:3001/openapi.yaml", {
    verbose: true,
  });
  const result = await chain.run(question);

  console.log({ result });
}

(async () => {
  await main(
    `Use the /students endpoint to find all students in homeroom 1, and then use the /attendances endpoint to mark those students as present on 2023-12-23`
  );
})();

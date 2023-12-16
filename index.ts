import dotenv from "dotenv";
import { RetrievalQAChain } from "langchain/chains";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export default async function main(question: string) {
  const env = process.env;
  const loader = new CSVLoader("students.csv");
  const docs = await loader.loadAndSplit();
  const store = await MemoryVectorStore.fromDocuments(
    docs,
    new OpenAIEmbeddings({ openAIApiKey: env.OPENAI_API_KEY })
  );

  const model = new OpenAI({ openAIApiKey: env.OPENAI_API_KEY });
  const template = `Use the following student table to answer the question at the end. The student table has 4 columns:
  1. firstname: string
  2. gender: M for male and F for female
  3. division: an integer from 1-10 indicating the homeroom of the student
  4. lastname: string
  Always respond in JSON format as an array of object {{"firstname": "string", "lastname": "string", gender: "string", divison: "integer"}}
  Student Table:
  {context}
  Question: {question}
  Answer:`;
  const chain = RetrievalQAChain.fromLLM(model, store.asRetriever(), {
    prompt: PromptTemplate.fromTemplate(template),
  });

  const res = await chain.call({
    query: question,
  });
  console.log("Answer:");
  console.log(JSON.parse(res.text));
}

(async () => {
  dotenv.config();
  await main(
    "List all the girls in division 10, ordered by name in alphabetical order."
  );
})();

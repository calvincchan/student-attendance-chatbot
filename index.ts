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
  const template = `Use the following student table to answer the question at the end. The student table has 5 columns:
  1. student_no: a unique 8-digital integer for each student
  2. homeroom: an integer from 1-10 indicating the homeroom of the student
  3. firstname: string
  4. lastname: string
  5. gender: M for male and F for female
  If you don't know the answer, please respond with "I don't know". Do not make up an answer.
  Respond in CSV format with the same 5 columns.
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
  console.log(res.text);
}

(async () => {
  dotenv.config();
  await main("List all the female students in homeroom 7.");
})();

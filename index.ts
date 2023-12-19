import * as dotenv from "dotenv";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { RunnableSequence } from "langchain/schema/runnable";
import { SqlDatabase } from "langchain/sql_db";
import { AppDataSource } from "./src/data-source";

export default async function main(question: string) {
  const env = process.env;

  const db = await SqlDatabase.fromDataSourceParams({
    appDataSource: AppDataSource,
  });

  const llm = new ChatOpenAI();

  /**
   * Create the first prompt template used for getting the SQL query.
   */
  const prompt =
    PromptTemplate.fromTemplate(`Based on the provided SQL table schema below, write a SQL query in SQLite dialect that would answer the user's question.
Use upsert syntax to insert or update the attendance record for the student. Never modify the student table. Always use absolute date.
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL QUERY:`);

  /**
   * Create a new RunnableSequence where we pipe the output from `db.getTableInfo()`
   * and the users question, into the prompt template, and then into the llm.
   * We're also applying a stop condition to the llm, so that it stops when it
   * sees the `\nSQLResult:` token.
   */
  const sqlQueryChain = RunnableSequence.from([
    {
      schema: async () => db.getTableInfo(),
      question: (input: { question: string }) => input.question,
    },
    prompt,
    llm.bind({ stop: ["\nSQLResult:"] }),
    new StringOutputParser(),
  ]);

  const res = await sqlQueryChain.invoke({ question });
  console.log({ res });

  /**
   * Create the final prompt template which is tasked with getting the natural language response.
   */
  const finalResponsePrompt =
    PromptTemplate.fromTemplate(`Based on the SQL table schema below, question, SQL query, and SQL response, write a natural language response:
------------
SCHEMA: {schema}
------------
QUESTION: {question}
------------
SQL QUERY: {query}
------------
SQL RESPONSE: {response}
------------
NATURAL LANGUAGE RESPONSE:`);

  /**
   * Create a new RunnableSequence where we pipe the output from the previous chain, the users question,
   * and the SQL query, into the prompt template, and then into the llm.
   * Using the result from the `sqlQueryChain` we can run the SQL query via `db.run(input.query)`.
   */
  const finalChain = RunnableSequence.from([
    {
      question: (input) => input.question,
      query: sqlQueryChain,
    },
    {
      schema: async () => db.getTableInfo(),
      question: (input) => input.question,
      query: (input) => input.query,
      response: (input) => db.run(input.query),
    },
    finalResponsePrompt,
    llm,
    new StringOutputParser(),
  ]);

  const finalResponse = await finalChain.invoke({ question });

  console.log({ finalResponse });
}

(async () => {
  dotenv.config();
  await main("All students in homeroom 7 as present on Dec 10 2023.");
})();

import cors from "@fastify/cors";
import * as dayjs from "dayjs";
import "dotenv/config";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseMessage, HumanMessage, SystemMessage } from "langchain/schema";
import { seedData } from "./seed-data";
import {
  ToolSchema,
  findAttendance,
  setAllPresentByHomeroom,
  setAttendance,
} from "./tools";
import fastify = require("fastify");

/** Process response from OpenAI, either print the response or call a tool. */
async function processResponse(response: BaseMessage) {
  // console.log(JSON.stringify(response, null, 2));
  const result: string[] = [];
  if (response.content) {
    console.log("✨", response.content);
    return;
  }
  if (response.additional_kwargs?.tool_calls) {
    const toolCalls = response.additional_kwargs.tool_calls;
    let shouldShowFinalResult = true;
    let finalResultHomeRoom = "";
    let finalResultDate = "";
    for (const toolCall of toolCalls) {
      const { function: func } = toolCall;
      const args = JSON.parse(func.arguments);
      console.log("🚀 Function call:", func.name, args);
      finalResultDate = args.date;
      finalResultHomeRoom = args.homeroom;
      if (func.name === "findAttendance") {
        await findAttendance(args);
        shouldShowFinalResult = false;
      } else if (func.name === "setAllPresentByHomeroom") {
        await setAllPresentByHomeroom(args);
      } else if (func.name === "setAttendance") {
        await setAttendance(args);
      }
    }
    if (shouldShowFinalResult) {
      await findAttendance({
        homeroom: finalResultHomeRoom,
        date: finalResultDate,
      });
    }
  }
}

export default async function main() {
  /** Init data for the test. */
  await seedData();

  /** Config context. */
  const defaultHomeroom = "1";
  const defaultDate = dayjs().format("YYYY-MM-DD");
  const defaultTeacherName = "Mr. Smith";

  /** Prepare LLM model with tools */
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo-1106",
    temperature: 0,
  }).bind({
    tools: ToolSchema,
    tool_choice: "auto",
  });

  /** Init message with context. */
  const initSystemMessage = new SystemMessage(
    `The following is a friendly conversation between a human and an AI. The AI helps the human to manage student attendance via function calls.
    --------
    Context:
    - Address the human as ${defaultTeacherName}.
    - Homeroom is always an integer between 1 and 7.
    - If not specified, the default homeroom is ${defaultHomeroom}.
    - Today's date is ${defaultDate}.
    - If the AI does not know the answer to a question, it truthfully says it does not know.
    `
  );

  /** Start API server */
  const host = process.env.HOST ? String(process.env.HOST) : "localhost";
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
  const server = fastify();
  await server.register(cors, { origin: true });
  server.get("/", async (request, reply) => {
    reply.send({ status: "OK" });
  });
  server.post<{ Body: { text: string } }>("/chat", async (request, reply) => {
    const { text } = request.body;
    const aiResponse = await model.invoke([
      initSystemMessage,
      new HumanMessage(text),
    ]);
    const result = await processResponse(aiResponse);
    reply.send({
      status: "OK",
      text: result,
    });
  });
  server.listen({ host, port }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}

(async () => {
  await main();
})();

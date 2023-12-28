import * as dayjs from "dayjs";
import "dotenv/config";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseMessage, HumanMessage, SystemMessage } from "langchain/schema";
import * as readline from "readline";
import { seedData } from "./seed-data";
import {
  ToolSchema,
  findAttendance,
  setAllPresentByHomeroom,
  setAttendance,
} from "./tools";

/** Process response from OpenAI, either print the response or call a tool. */
async function processResponse(response: BaseMessage) {
  console.log(JSON.stringify(response, null, 2));
  if (response.content) {
    console.log("✨", response.content);
    return;
  }
  if (response.additional_kwargs?.tool_calls) {
    const toolCalls = response.additional_kwargs.tool_calls;
    for (const toolCall of toolCalls) {
      const { function: func } = toolCall;
      console.log(
        "🚀 ~ file: index.ts:89 ~ processResponse ~ toolCall:",
        toolCall
      );
      const args = JSON.parse(func.arguments);
      if (func.name === "findAttendance") {
        await findAttendance(args);
      } else if (func.name === "setAllPresentByHomeroom") {
        await setAllPresentByHomeroom(args);
        await findAttendance(args);
      } else if (func.name === "setAttendance") {
        await setAttendance(args);
        await findAttendance(args);
      }
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
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  }).bind({
    tools: ToolSchema,
    tool_choice: "auto",
  });

  /** Init message with context. */
  const initSystemMessage = new SystemMessage(
    `The following is a friendly conversation between a human teacher and an AI. The AI helps the teacher to manage student attendance via function calls.
    --------
    Context:
    - Address the human user as ${defaultTeacherName}.
    - Homeroom is always an integer between 1 and 7.
    - If not specified, the default homeroom is ${defaultHomeroom}.
    - Today's date is ${defaultDate}.
    - If the AI does not know the answer to a question, it truthfully says it does not know.
    --------
    Examples:
    - Teacher: Mark all students as present, except for John who has fever.
      1. function name: "setAllPresentByHomeroom", args: {{homeroom: "${defaultHomeroom}", date: "${defaultDate}"}}
      2. function name: "setAttendance", args: {{name: "John", homeroom: "${defaultHomeroom}", date: "${defaultDate}", present: false, reason: "fever"}}
    - Teacher: Tom is sick today. The rest of the class is present.
      1. function name: "setAllPresentByHomeroom", args: {{homeroom: "${defaultHomeroom}", date: "${defaultDate}"}}
      2. function name: "setAttendance", args: {{name: "Tom", homeroom: "${defaultHomeroom}", date: "${defaultDate}", present: false, reason: "sick"}}
    - Teacher: Show attendance for Lily.
      function name: "findAttendance", args: {{name: "Lily Garcia", homeroom: "${defaultHomeroom}"}}
    - Teacher: Mia is sick today.
      function name: "setAttendance", args: {{name: "Mia", homeroom: "${defaultHomeroom}", date: "${defaultDate}", present: false, reason: "sick"}}
    - Teacher: Who was absent last week?
      function name: "findAttendance", args: {{homeroom: "${defaultHomeroom}", present: false, fromDate: "${dayjs(
      defaultDate
    )
      .subtract(7, "days")
      .format("YYYY-MM-DD")}", toDate: "${defaultDate}"}}
    `
  );
  const result = await model.invoke([
    initSystemMessage,
    new HumanMessage(`Hello, What's the default homeroom and today's date?`),
  ]);
  processResponse(result);

  /**
   * Start an interactive prompt user interface.
   */
  const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  userInterface.prompt();
  userInterface.on("line", async (text) => {
    const response = await model.invoke([
      initSystemMessage,
      new HumanMessage(text),
    ]);
    await processResponse(response);
    userInterface.prompt();
  });
}

(async () => {
  await main();
})();

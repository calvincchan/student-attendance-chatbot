import * as dayjs from "dayjs";
import "dotenv/config";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseMessage, FunctionMessage } from "langchain/dist/schema";
import { OpenAI } from "openai";
import * as readline from "readline";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

interface IStudent {
  id: string;
  homeroom: string;
  name: string;
}

interface IAttendance {
  date: string;
  student_id: string;
  present: boolean;
  reason?: string;
}

const toolSchema: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "findStudents",
      description: "Get a list of students with optional filters",
      parameters: zodToJsonSchema(
        z.object({
          homeroom: z.string().optional().describe("Filter by homeroom"),
          isPresent: z
            .boolean()
            .optional()
            .describe("Filter by present status"),
          studentId: z.string().optional().describe("Filter by student ID"),
        })
      ),
    },
  },
  {
    type: "function",
    function: {
      name: "setAllPresentByHomeroom",
      description: "Mark all students in a homeroom as present",
      parameters: zodToJsonSchema(
        z.object({
          homeroom: z.string().describe("Homeroom"),
          date: z.string().describe("Date"),
        })
      ),
    },
  },
];

/** Get a list of students with optional filters */
async function findStudents(
  homeroom: string = "1",
  isPresent?: boolean
): Promise<IStudent[]> {
  return [
    { id: "1001", homeroom, name: "John" },
    { id: "1002", homeroom, name: "Tom" },
    { id: "1003", homeroom, name: "Emily" },
  ];
}

async function setAllPresentByHomeroom(homeroom: string, date: string) {
  console.log(
    `Mark all students in homeroom ${homeroom} as present on ${date}`
  );
}

async function processResponse(response: BaseMessage) {
  const functionResponse = response as FunctionMessage;
  console.log("🔥", functionResponse);
  if (response.content) {
    console.log("✨", response.content);
    return;
  }
}

export default async function main() {
  const defaultHomeroom = "1";
  const defaultDate = dayjs().format("YYYY-MM-DD");
  const defaultTeacherName = "Mr. Smith";

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  }).bind({
    tools: toolSchema,
    tool_choice: "auto",
  });

  // const chain = new LLMChain({
  //   llm: model,
  //   prompt,
  // });

  // /** Init API request */
  // const result = await chain.call({
  //   homeroom: defaultHomeroom,
  //   date: defaultDate,
  //   text: `Please mark all students in my class as present today.`,
  // });
  const result = await model.invoke([
    [
      "system",
      `You are a helpful assistance that help a human teacher to interact with a student attendance management system with function calls. Use the following context to help you understand the conversation. Address the human user as ${defaultTeacherName}.
    ----------
    Teacher homeroom: ${defaultHomeroom}
    Today's date: ${defaultDate}
    `,
    ],
    ["human", `Hello, What's my name and today's date?`],
  ]);
  console.log(JSON.stringify(result, null, 2));

  /**
   * Create an interactive prompt user interface.
   */
  const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  userInterface.prompt();
  userInterface.on("line", async (text) => {
    const response = await model.invoke(["human", text]);
    await processResponse(response);
    userInterface.prompt();
  });
}

(async () => {
  await main();
})();

import * as dayjs from "dayjs";
import "dotenv/config";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseMessage, HumanMessage, SystemMessage } from "langchain/schema";
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
          present: z.boolean().optional().describe("Filter by present status"),
          studentId: z.string().optional().describe("Filter by student ID"),
          fromDate: z
            .string()
            .optional()
            .describe("Filter by from date: YYYY-MM-DD"),
          toDate: z
            .string()
            .optional()
            .describe("Filter by to date: YYYY-MM-DD"),
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
async function findStudents(args: {
  homeroom?: string;
  isPresent?: boolean;
}): Promise<IStudent[]> {
  const { homeroom } = args;
  return [
    { id: "1001", homeroom, name: "John" },
    { id: "1002", homeroom, name: "Tom" },
    { id: "1003", homeroom, name: "Emily" },
  ];
}

async function setAllPresentByHomeroom(args: {
  homeroom: string;
  date: string;
}) {
  const { homeroom, date } = args;
  console.log(
    `Mark all students in homeroom ${homeroom} as present on ${date}`
  );
}

/** Process response from OpenAI, either print the response or call a tool. */
async function processResponse(response: BaseMessage) {
  // console.log(JSON.stringify(response, null, 2));
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
      if (func.name === "findStudents") {
        const students = await findStudents(args);
        console.log("✨", students);
      } else if (func.name === "setAllPresentByHomeroom") {
        await setAllPresentByHomeroom(args);
      }
    }
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

  /** Init message. */
  const result = await model.invoke([
    new SystemMessage(
      `The following is a friendly conversation between a human teacher and an AI. The AI helps the teacher to manage student attendance via function calls.
--------
Context:
- Address the human user as ${defaultTeacherName}.
- The default homeroom is ${defaultHomeroom}.
- Today's date is ${defaultDate}.
- If the AI does not know the answer to a question, it truthfully says it does not know.
--------
Examples:
- Teacher: Mark all students as present, except for John who has fever.
  function name: "setAllPresentByHomeroom", args: {{homeroom: "${defaultHomeroom}", date: "${defaultDate}"}}
  function name: "setAttendance", args: {{name: "John", date: "${defaultDate}", present: false, reason: "fever"}}
- Teacher: Tom is sick today. The rest of the class is present.
  function name: "setAllPresentByHomeroom", args: {{homeroom: "${defaultHomeroom}", date: "${defaultDate}"}}
  function name: "setAttendance", args: {{name: "Tom", date: "${defaultDate}", present: false, reason: "sick"}}
- Teacher: Who was absent in homeroom 7 last week?
  function name: "getAttendances", args: {{homeroom: "7", present: false, fromDate: "${dayjs(
    defaultDate
  )
    .subtract(7, "days")
    .format("YYYY-MM-DD")}", toDate: "${defaultDate}"}}
`
    ),
    new HumanMessage(`Hello, What's my name and today's date?`),
  ]);
  processResponse(result);

  /**
   * Create an interactive prompt user interface.
   */
  const userInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  userInterface.prompt();
  userInterface.on("line", async (text) => {
    const response = await model.invoke([new HumanMessage(text)]);
    await processResponse(response);
    userInterface.prompt();
  });
}

(async () => {
  await main();
})();

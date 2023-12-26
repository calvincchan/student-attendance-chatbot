import "dotenv/config";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";

export default async function main(question: string) {
  const prompt = PromptTemplate.fromTemplate(
    `Task: Record Daily Student Attendance
----------
Description: You interact with a system that records daily student attendance with function calls.
----------
Functions:
1. func: "getStudents", args: {{homeroom?: string, isPresent?: boolean}}
2. func: "getStudent", args: {{studentId: string}}
3. func: "findStudent", args: {{name: string}}
5. func: "setAttendance", args: {{studentId: string, name?: string, date: string, isPresent: boolean, reason?: string}}
6. func: "setAllPresentByHomeroom", args: {{homeroom: string, date: string}}
7. func: "unsetAttendance", args: {{studentId: string, date: string}}
8. func: "getAttendance", args: {{studentId: string, date: string}}
9. func: "getAttendances", args: {{homeroom?: string, isPresent?: boolean, fromDate?: string, toDate?: string}}
----------
Example:
1. Query: mark all students in homeroom 4 as present on 2023-12-23, except for Emily who has fever:
   func: "setAllPresentByHomeroom", args: {{homeroom: "4", date: "2023-12-23"}}
   func: "setAttendance", args: {{name: "Emily", date: "2023-12-23", isPresent: false, reason: "fever"}}
2. Query: Tom is sick today. The rest of the class is present.
   func: "setAllPresentByHomeroom", args: {{homeroom: "4", date: "2023-12-23"}}
   func: "setAttendance", args: {{name: "Tom", "2023-12-23", false, "sick"}}
3. Query: Who was absent in homeroom 7 last week?
   func: "getAttendances", args: {{homeroom: "7", isPresent: false, fromDate: "2023-12-16", toDate: "2023-12-22"}}
----------
Your response must be in JSON format that describes function calls based on user requests. Example:
[{{
  func: "setAllPresentByHomeroom",
  args: {{homeroom: "1", date: "2023-12-23"}}
}},{{
  func: "unsetAttendance",
  args: {{studentId: "1001", date: "2023-12-23"}}
}},{{
  func: "setAttendance",
  args: {{name: "John", date: "2023-12-23", isPresent: false, reason: "sick"}}
}}]
----------
Question: {question}
`
  );

  const llm = new OpenAI({ temperature: 0 });

  const formatChain = new LLMChain({
    llm,
    prompt,
  });

  console.log("Question:", question);

  const result = await formatChain.invoke({
    question,
  });

  console.log(result.text);
}

(async () => {
  await main(
    `Mark all students in homeroom 1 as present on 2023-12-23, except for John who is sick`
  );
})();

import "dotenv/config";
import { OpenAI } from "openai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AppDataSource } from "./data-source";
import { Attendance } from "./entity/Attendance";
import { Student } from "./entity/Student";

export const ToolSchema: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "findAttendance",
      description: "Get a list of attendance with optional filters",
      parameters: zodToJsonSchema(
        z.object({
          studentId: z.string().optional().describe("Filter by student ID"),
          studentName: z.string().optional().describe("Filter by student name"),
          homeroom: z.string().describe("Filter by homeroom"),
          present: z.boolean().optional().describe("Filter by present status"),
          date: z
            .string()
            .optional()
            .describe("Filter by exact date: YYYY-MM-DD"),
          fromDate: z
            .string()
            .optional()
            .describe("Filter by date range - from date: YYYY-MM-DD"),
          toDate: z
            .string()
            .optional()
            .describe("Filter by date range - to date: YYYY-MM-DD"),
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
  {
    type: "function",
    function: {
      name: "setAttendance",
      description: "Set attendance for a student",
      parameters: zodToJsonSchema(
        z.object({
          name: z.string().describe("Student name"),
          homeroom: z.string().describe("Homeroom"),
          date: z.string().describe("Date"),
          present: z.boolean().describe("Present status"),
          reason: z.string().optional().describe("Reason for absence"),
        })
      ),
    },
  },
];

/** Find a single student with given name and homeroom. */
async function findStudentByNameAndHomeroom(name: string, homeroom: string) {
  const query = AppDataSource.getRepository(Student).createQueryBuilder();
  query.where("Student.name LIKE :name", { name: `%${name}%` });
  query.andWhere({ homeroom });
  const res = await query.getMany();
  if (res) {
    if (res.length > 1) {
      console.log(
        `Found multiple students with name ${name}. Please be more specific.`
      );
      return null;
    }
    return res[0];
  }
  console.log(`Cannot find student with name ${name}`);
  return null;
}

/** Get a list of students with optional filters */
export async function findAttendance(args: {
  studentId?: string;
  studentName?: string;
  homeroom?: string;
  present?: boolean;
  date?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const query = AppDataSource.getRepository(Attendance).createQueryBuilder();
  if (args.date) {
    query.andWhere("attendance.date = :date", { date: args.date });
  }
  if (args.studentId) {
    query.andWhere("attendance.student_id = :student_id", {
      student_id: args.studentId,
    });
  }
  if (args.studentName) {
    const res = await findStudentByNameAndHomeroom(
      args.studentName,
      args.homeroom
    );
    if (res) {
      query.andWhere("attendance.student_id = :student_id", {
        student_id: res.id,
      });
    }
  }
  // if (args.homeroom) {
  //   query.andWhere("attendance.homeroom = :homeroom", {
  //     homeroom: args.homeroom,
  //   });
  // }
  if (args.present !== undefined) {
    query.andWhere("attendance.present = :present", { present: args.present });
  }
  if (args.fromDate) {
    query.andWhere("attendance.date >= :from_date", {
      from_date: args.fromDate,
    });
  }
  if (args.toDate) {
    query.andWhere("attendance.date <= :to_date", { to_date: args.toDate });
  }
  query.leftJoinAndSelect(
    "student",
    "Student",
    "student.id = attendance.student_id"
  );
  console.log(query.getQueryAndParameters());
  const rows = await query.getRawMany();
  const headers = [
    "Student_id",
    "Student_name",
    "Student_homeroom",
    "Attendance_date",
    "Attendance_present",
    "Attendance_reason",
  ];
  /** for each row, display the columns in the order of headers */
  rows.map((row) =>
    console.log(headers.map((header) => row[header]).join("\t"))
  );
}

/** Set multiple attendance records as present. */
export async function setAllPresentByHomeroom(args: {
  homeroom: string;
  date: string;
}) {
  const { homeroom, date } = args;
  const res = await AppDataSource.manager.query(
    `INSERT OR REPLACE INTO attendance (student_id, date, present)
  SELECT student.id, :date, true
  FROM student
  WHERE student.homeroom = :homeroom;`,
    [date, homeroom]
  );
  console.log(
    `Marked all students in homeroom ${homeroom} as present on ${date}`
  );
}

export async function setAttendance(args: {
  name: string;
  homeroom: string;
  date: string;
  present: boolean;
  reason: string;
}) {
  const { name, homeroom, date, present, reason } = args;
  const student = await findStudentByNameAndHomeroom(name, homeroom);
  if (!student) {
    return;
  }
  const res = await AppDataSource.manager.query(
    `INSERT OR REPLACE INTO attendance (student_id, date, present, reason)
  VALUES (:studentId, :date, :present, :reason);`,
    [student.id, date, present, reason]
  );
  console.log("🚀 ~ file: tools.ts:176 ~ res:", res);
  console.log(
    `Set attendance for student ${student.id} on ${date} to ${present} with reason ${reason}`
  );
}

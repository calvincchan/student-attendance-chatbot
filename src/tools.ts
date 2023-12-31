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
      description: "Get a list of attendance with filters",
      parameters: zodToJsonSchema(
        z.object({
          homeroom: z.string().describe("Filter by homeroom, required"),
          studentId: z.string().optional().describe("Filter by student ID"),
          studentName: z.string().optional().describe("Filter by student name"),
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
      throw Error(
        `Found multiple students with name ${name}. Please be more specific.`
      );
    } else if (res.length === 1) {
      return res[0];
    } else {
      throw Error(`Cannot find student with name ${name}`);
    }
  } else {
    throw Error(`Error finding student with name ${name}`);
  }
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
    try {
      const student = await findStudentByNameAndHomeroom(
        args.studentName,
        args.homeroom
      );
      if (student) {
        query.andWhere("attendance.student_id = :student_id", {
          student_id: student.id,
        });
      }
    } catch (e) {
      return e.message;
    }
  }
  if (args.homeroom) {
    query.andWhere("attendance.homeroom = :homeroom", {
      homeroom: args.homeroom,
    });
  }
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
  // console.log(query.getQueryAndParameters());
  const rows = await query.getRawMany();
  const headers = [
    "Student_id",
    "Student_name",
    "Attendance_date",
    "Attendance_present",
    "Attendance_reason",
    "Student_homeroom",
  ];
  /** for each row, display the columns in the order of headers */
  if (rows.length > 0) {
    return rows
      .map((row) => {
        return row.Attendance_present
          ? `- ${row.Student_name} was present on ${row.Attendance_date}.`
          : `- ${row.Student_name} was absent on ${
              row.Attendance_date
            } with reason "${row.Attendance_reason || "N/A"}".`;
      })
      .join("\n");
  } else {
    return "No attendance records found.";
  }
}

/** Set multiple attendance records as present. */
export async function setAllPresentByHomeroom(args: {
  homeroom: string;
  date: string;
}) {
  const { homeroom, date } = args;
  const res = await AppDataSource.manager.query(
    `INSERT OR REPLACE INTO attendance (student_id, date, homeroom, present)
  SELECT student.id, :date, student.homeroom, true
  FROM student
  WHERE student.homeroom = :homeroom;`,
    [date, homeroom]
  );
  return `Marked all students in homeroom ${homeroom} as present on ${date}`;
}

/** Set a single attendance record */
export async function setAttendance(args: {
  name: string;
  homeroom: string;
  date: string;
  present: boolean;
  reason: string;
}) {
  const { name, homeroom, date, present, reason } = args;
  let student: Student;
  try {
    student = await findStudentByNameAndHomeroom(name, homeroom);
  } catch (e) {
    return e.message;
  }
  const res = await AppDataSource.manager.query(
    `INSERT OR REPLACE INTO attendance (student_id, date, homeroom, present, reason)
  VALUES (:studentId, :date, :homeroom, :present, :reason);`,
    [student.id, date, student.homeroom, present, reason]
  );
  return `Set attendance for student ${student.id} on ${date} to ${present} with reason ${reason}`;
}

import * as dayjs from "dayjs";
import { FastifyPluginAsync } from "fastify";
import { AppDataSource } from "./data-source";
import { Attendance } from "./entity/Attendance";
import { Student } from "./entity/Student";

interface ListQuerystring {
  date?: string;
  student_id?: string;
  student_name?: string;
  homeroom?: string;
  present?: boolean;
  from_date?: string;
  to_date?: string;
}

interface PostBody {
  date: string;
  student_id?: string;
  student_name?: string;
  homeroom?: string;
  present: boolean;
  reason?: string;
}

const InsertSchema = {
  type: "object",
  required: ["date", "present"],
  properties: {
    date: { type: "string" },
    student_id: { type: "string" },
    student_name: { type: "string" },
    homeroom: { type: "string" },
    present: {
      type: "boolean",
      description: "true if present, false if absent",
    },
    reason: {
      type: "string",
      description: "if the attendance record is absent, reason for absence",
    },
  },
};

const AttendanceSchema = {
  type: "object",
  properties: {
    date: { type: "string" },
    student_id: { type: "string" },
    present: {
      type: "boolean",
      description: "true if present, false if absent",
    },
    reason: {
      type: "string",
      description: "if the attendance record is absent, reason for absence",
    },
  },
};

export const AttendanceHandler: FastifyPluginAsync = async function (app) {
  app.get<{ Querystring: ListQuerystring }>(
    "/",
    {
      schema: {
        operationId: "listAttendance",
        description: "Get a list of attendance with optional filter",
        tags: ["Attendance"],
        querystring: {
          date: {
            description: "Filter by date",
            type: "string",
          },
          student_id: {
            description: "Filter by student_id",
            type: "string",
          },
          student_name: {
            description: "Filter by student_name",
            type: "string",
          },
          homeroom: {
            description: "Filter by homeroom",
            type: "string",
          },
          present: {
            description: "Filter by present",
            type: "boolean",
          },
          from_date: {
            description: "Filter by from_date: YYYY-MM-DD",
            type: "string",
          },
          to_date: {
            description: "Filter by to_date: YYYY-MM-DD",
            type: "string",
          },
        },
        response: {
          200: {
            type: "array",
            items: AttendanceSchema,
          },
        },
      },
    },
    async (req, reply) => {
      const filters = req.query;
      const query =
        AppDataSource.getRepository(Attendance).createQueryBuilder();
      if (filters.date) {
        query.andWhere("attendance.date = :date", { date: filters.date });
      }
      if (filters.student_id) {
        query.andWhere("attendance.student_id = :student_id", {
          student_id: filters.student_id,
        });
      }
      // if (filters.student_name) {
      //   query.where("attendance.student_name = :student_name", {
      //     student_id: filters.student_id,
      //   });
      // }
      // if (filters.homeroom) {
      //   query.andWhere("attendance.homeroom = :homeroom", {
      //     homeroom: filters.homeroom,
      //   });
      // }
      if (filters.present !== undefined) {
        query.andWhere("attendance.present = :present", {
          present: filters.present,
        });
      }
      if (filters.from_date) {
        query.andWhere("attendance.date >= :from_date", {
          from_date: filters.from_date,
        });
      }
      if (filters.to_date) {
        query.andWhere("attendance.date <= :to_date", {
          to_date: filters.to_date,
        });
      }
      const rows = await query.getMany();
      reply.send(rows);
    }
  );

  app.post<{ Body: PostBody }>(
    "/",
    {
      schema: {
        operationId: "insertAttendance",
        description: "Insert a new attendance",
        tags: ["Attendance"],
        body: InsertSchema,
      },
    },
    async (req, reply) => {
      const Attendances = AppDataSource.getRepository(Attendance);
      const body: PostBody = req.body;
      const attendance = new Attendance();
      attendance.date = dayjs(body.date).startOf("day").toDate();
      attendance.student_id = body.student_id;
      attendance.present = body.present;
      attendance.reason = body.reason;
      const output = await Attendances.upsert(attendance, {
        conflictPaths: ["date", "student_id"],
      });
    }
  );

  app.patch<{ Body: PostBody }>(
    "/",
    {
      schema: {
        operationId: "updateAttendance",
        description: "Update an existing attendance",
        tags: ["Attendance"],
        body: InsertSchema,
      },
    },
    async (req, reply) => {
      const Attendances = AppDataSource.getRepository(Attendance);
      const Students = AppDataSource.getRepository(Student);
      const body: PostBody = req.body;
      const attendance = new Attendance();
      attendance.date = dayjs(body.date).startOf("day").toDate();
      if (body.student_id) {
        attendance.student_id = body.student_id;
      } else if (body.student_name) {
        const student = await Students.findOne({
          where: { name: body.student_name },
        });
        console.log("🚀 ~ file: attendance.ts:166 ~ student:", student);
      }
      attendance.present = body.present;
      attendance.reason = body.reason;
      const output = await Attendances.upsert(attendance, {
        conflictPaths: ["date", "student_id"],
      });
    }
  );
};

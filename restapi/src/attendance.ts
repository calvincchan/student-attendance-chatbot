import * as dayjs from "dayjs";
import { FastifyPluginAsync } from "fastify";
import { AppDataSource } from "./data-source";
import { Attendance } from "./entity/Attendance";

interface ListQuerystring {
  date: string;
  student_id: string;
  present: boolean;
}

interface PostBody {
  date: string;
  student_id: string;
  present: boolean;
  reason?: string;
}

const AttendanceSchema = {
  type: "object",
  required: ["date", "student_id", "present"],
  properties: {
    date: { type: "string" },
    student_id: { type: "string" },
    present: { type: "boolean" },
    reason: { type: "string" },
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
          present: {
            description: "Filter by present",
            type: "boolean",
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
      const query =
        AppDataSource.getRepository(Attendance).createQueryBuilder();
      if (req.query.date) {
        query.where("attendance.date = :date", { date: req.query.date });
      }
      if (req.query.student_id) {
        query.where("attendance.student_id = :student_id", {
          student_id: req.query.student_id,
        });
      }
      if (req.query.present !== undefined) {
        query.where("attendance.present = :present", {
          present: Boolean(req.query.present),
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
        operationId: "createAttendance",
        description: "Create a new attendance",
        tags: ["Attendance"],
        body: AttendanceSchema,
        response: {
          200: AttendanceSchema,
        },
      },
    },
    async (req, reply) => {
      const repo = AppDataSource.getRepository(Attendance);
      const body: PostBody = req.body;
      const attendance = new Attendance();
      attendance.date = dayjs(body.date).startOf("day").toDate();
      attendance.student_id = body.student_id;
      attendance.present = body.present;
      attendance.reason = body.reason;
      const output = await repo.upsert(attendance, {
        conflictPaths: ["date", "student_id"],
      });
    }
  );
};

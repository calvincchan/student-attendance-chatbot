import { FastifyPluginAsync } from "fastify";
import { FindOptionsOrder, FindOptionsWhere } from "typeorm";
import { AppDataSource } from "./data-source";
import { Student } from "./entity/Student";

interface ListQuerystring {
  where?: string;
  order?: string;
}

const StudentSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    homeroom: { type: "string" },
    firstname: { type: "string" },
    lastname: { type: "string" },
    gender: { type: "string" },
  },
};

export const StudentHandler: FastifyPluginAsync = async function (app) {
  app.get<{ Querystring: ListQuerystring }>(
    "/",
    {
      schema: {
        operationId: "listStudents",
        description: "Get a list of student",
        tags: ["Student"],
        querystring: {
          where: {
            description: "JSON string that conform to typeorm FindOptionsWhere",
          },
        },
        response: {
          200: {
            type: "array",
            items: StudentSchema,
          },
        },
      },
    },
    async (req, reply) => {
      const where: FindOptionsWhere<Student> | FindOptionsWhere<Student>[] =
        JSON.parse(req.query.where || "{}");
      const order: FindOptionsOrder<Student> = JSON.parse(
        req.query.order || "{}"
      );
      const rows = await AppDataSource.manager.find(Student, { where, order });
      reply.send(rows);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/:id",
    {
      schema: {
        operationId: "getStudentById",
        description: "Get a student by id",
        tags: ["Student"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: StudentSchema,
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params;
      const row = await AppDataSource.manager.findOne(Student, {
        where: { id },
      });
      reply.send(row);
    }
  );
};

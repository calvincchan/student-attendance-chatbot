import { FastifyPluginAsync } from "fastify";
import { AppDataSource } from "./data-source";
import { Student } from "./entity/Student";

interface ListQuerystring {
  homeroom: string;
  name: string;
}

const StudentSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    homeroom: { type: "string" },
    name: { type: "string" },
    gender: { type: "string" },
  },
};

export const StudentHandler: FastifyPluginAsync = async function (app) {
  app.get<{ Querystring: ListQuerystring }>(
    "/",
    {
      schema: {
        operationId: "listStudent",
        description: "Get a list of student with optional filters",
        tags: ["Student"],
        querystring: {
          homeroom: {
            description: "Filter by homeroom",
            type: "string",
          },
          name: {
            description: "Filter by student name",
            type: "string",
          },
          gender: {
            description: "filter by gender: M or F",
            type: "string",
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
      const filters = req.query;
      const Students = AppDataSource.getRepository(Student);
      const query = Students.createQueryBuilder();
      if (filters.homeroom) {
        query.andWhere("homeroom = :homeroom", { homeroom: filters.homeroom });
      }
      if (filters.name) {
        query.andWhere("name LIKE :name", { name: `%${filters.name}%` });
      }
      const rows = await query.getMany();
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

import { FastifyPluginAsync } from "fastify";
import { AppDataSource } from "./data-source";
import { Student } from "./entity/Student";

interface ListQuerystring {
  homeroom?: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
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
        operationId: "listStudent",
        description: "Get a list of student with optional filter and order",
        tags: ["Student"],
        querystring: {
          homeroom: {
            description: "Filter by homeroom",
            type: "string",
          },
          firstname: {
            description: "Filter by firstname",
            type: "string",
          },
          lastname: {
            description: "Filter by lastname",
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
      const where: ListQuerystring = {
        homeroom: req.query.homeroom,
        firstname: req.query.firstname,
        lastname: req.query.lastname,
        gender: req.query.gender,
      };
      const rows = await AppDataSource.manager.find(Student, { where });
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

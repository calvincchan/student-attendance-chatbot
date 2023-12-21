import { FastifyPluginAsync } from "fastify";
import { FindOptionsOrder, FindOptionsWhere } from "typeorm";
import { AppDataSource } from "./data-source";
import { Student } from "./entity/Student";

interface ListQuerystring {
  where?: string;
  order?: string;
}

export const StudentHandler: FastifyPluginAsync = async function (app) {
  app.get<{ Querystring: ListQuerystring }>(
    "/",
    {
      schema: {
        description: "Get a list of student",
        tags: ["Student"],
        querystring: {
          type: "object",
          properties: {
            filters: { type: "string" },
            order: { type: "string" },
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
        description: "Get a student by id",
        tags: ["Student"],
        params: {
          type: "object",
          properties: {
            id: { type: "string" },
          },
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

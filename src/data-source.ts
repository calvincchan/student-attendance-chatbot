import "reflect-metadata";
import { DataSource } from "typeorm";
import { Student } from "./entity/Student";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.db",
  synchronize: true,
  logging: false,
  entities: [Student],
  migrations: [],
  subscribers: [],
});

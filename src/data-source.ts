import "reflect-metadata";
import { DataSource } from "typeorm";
import { Attendance } from "./entity/Attendance";
import { Student } from "./entity/Student";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: ":memory:",
  synchronize: true,
  logging: false,
  entities: [Student, Attendance],
  migrations: [],
  subscribers: [],
});

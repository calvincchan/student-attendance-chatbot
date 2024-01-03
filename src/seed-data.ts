import { parse } from "csv-parse/sync";
import * as dayjs from "dayjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { AppDataSource } from "./data-source";
import { Attendance } from "./entity/Attendance";
import { Student } from "./entity/Student";

/** Load seed data to database. */
export async function seedData() {
  await AppDataSource.initialize();

  /** Loading students into the database */
  console.log("Loading students into the database...");
  const records = parse(readFileSync(resolve("./data/student.csv")), {
    columns: true,
  });

  for (const record of records) {
    const student = new Student();
    student.id = record.id;
    student.homeroom = record.homeroom;
    student.name = [record.firstname, record.lastname].join(" ");
    student.gender = record.gender;
    await AppDataSource.manager.save(student);
  }

  /** Loading attendance entries to the database */
  const records2 = parse(readFileSync(resolve("./data/attendance.csv")), {
    columns: true,
  });

  for (const record of records2) {
    const attendance = new Attendance();
    attendance.date = dayjs(record.date).startOf("day").toDate();
    attendance.student_id = record.student_id;
    attendance.homeroom = record.homeroom;
    attendance.present = Boolean(record.present === "Y");
    attendance.reason = record.reason;
    await AppDataSource.manager.save(attendance);
  }
}

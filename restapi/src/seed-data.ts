import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { resolve } from "path";
import { AppDataSource } from "./data-source";
import { Student } from "./entity/Student";

/** Load seed data */
export async function SeedData() {
  await AppDataSource.initialize();
  console.log("Loading students into the database...");
  const records = parse(readFileSync(resolve("./data/students.csv")), {
    columns: true,
  });

  for (const record of records) {
    const student = new Student();
    student.id = record.student_no;
    student.homeroom = record.homeroom;
    student.firstname = record.firstname;
    student.lastname = record.lastname;
    student.gender = record.gender;
    await AppDataSource.manager.save(student);
  }

  // console.log("Loaded students: ", records);
}

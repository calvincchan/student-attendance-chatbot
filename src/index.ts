import { AppDataSource } from "./data-source";
// import { Student } from "./entity/Student";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";

async function main() {
  await AppDataSource.initialize();
  console.log("Inserting students into the database...");
  const records = parse(readFileSync("students.csv"), { columns: true });
  console.log("🚀 ~ file: index.ts:10 ~ main ~ records:", records);

  // for (const record of records) {
  //   const student = new Student();
  //   student.student_no = record.student_no;
  //   student.homeroom = record.homeroom;
  //   student.firstname = record.firstname;
  //   student.lastname = record.lastname;
  //   student.gender = record.gender;
  //   await AppDataSource.manager.save(student);
  // }

  // const student = new Student();
  // student.homeroom = "7";
  // student.firstname = "Timber";
  // student.lastname = "Saw";
  // student.gender = "M";
  // await AppDataSource.manager.save(student);
  // console.log("Saved a new user with id: " + student.id);

  // console.log("Loading users from the database...");
  // const students = await AppDataSource.manager.find(Student);
  // console.log("Loaded students: ", students);

  // console.log(
  //   "Here you can setup and run express / fastify / any other framework."
  // );
}

main().catch((error) => console.log(error));

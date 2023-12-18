import { AppDataSource } from "./data-source";
import { Student } from "./entity/Student";

AppDataSource.initialize()
  .then(async () => {
    console.log("Inserting a new user into the database...");
    const student = new Student();
    student.homeroom = "7";
    student.firstName = "Timber";
    student.lastName = "Saw";
    student.gender = "M";
    await AppDataSource.manager.save(student);
    console.log("Saved a new user with id: " + student.id);

    console.log("Loading users from the database...");
    const students = await AppDataSource.manager.find(Student);
    console.log("Loaded students: ", students);

    console.log(
      "Here you can setup and run express / fastify / any other framework."
    );
  })
  .catch((error) => console.log(error));

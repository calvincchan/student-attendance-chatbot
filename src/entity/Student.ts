import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  student_no: string;

  @Column()
  homeroom: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  gender: string;
}

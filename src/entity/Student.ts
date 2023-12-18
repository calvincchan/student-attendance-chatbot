import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  homeroom: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  gender: string;
}

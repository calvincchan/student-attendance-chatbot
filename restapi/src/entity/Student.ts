import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Student {
  @PrimaryColumn()
  id: string;

  @Column()
  homeroom: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  gender: string;
}

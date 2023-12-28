import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Student {
  @PrimaryColumn()
  id: string;

  @Column()
  homeroom: string;

  @Column()
  name: string;

  @Column()
  gender: string;
}

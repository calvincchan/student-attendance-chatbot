import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Attendance {
  @PrimaryColumn({ type: "date" }) // This creates a compound primary key on "date" and "student_id"
  date: Date;

  @PrimaryColumn() // This creates a compound primary key on "date" and "student_id"
  student_id: string; // Reference ID from Student table

  @Column({ type: "text" })
  homeroom: string;

  @Column({ type: "boolean" })
  present: boolean;

  // Optional additional fields:
  // - reason: string; // Reason for absence (if not present)
  // - period: string; // Session or period attended
  // - note: string; // Additional notes for the day
  @Column({ type: "text", nullable: true })
  reason?: string;
}

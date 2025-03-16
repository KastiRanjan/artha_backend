import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Attendance } from './attendence.entity';

@Entity()
export class AttendanceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clockOut: string;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @Column()
  attendanceId: string;

  @Column({ nullable: true })
  remark: string;

  @ManyToOne(() => Attendance, attendance => attendance.history)
  attendance: Attendance;
}
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingBatchEntity } from './training-batch.entity';
import { TrainingAttendanceEntity } from './training-attendance.entity';

@Entity({ name: 'training_sessions' })
export class TrainingSessionEntity extends CustomBaseEntity {
  @ManyToOne(() => TrainingBatchEntity, (batch) => batch.sessions, { onDelete: 'CASCADE' })
  batch: TrainingBatchEntity;

  @Column({ type: 'int', default: 1 })
  sessionNumber: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD (AD)

  @Column({ nullable: true })
  dateNepali: string; // YYYY-MM-DD (BS)

  @Column({ length: 10, default: '10:00' })
  startTime: string; // HH:mm

  @Column({ length: 10, default: '12:00' })
  endTime: string; // HH:mm

  @Column({ nullable: true })
  venueOrLink: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ default: false })
  isCompleted: boolean;

  @OneToMany(() => TrainingAttendanceEntity, (attendance) => attendance.session)
  attendances: TrainingAttendanceEntity[];
}

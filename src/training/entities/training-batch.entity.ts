import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TrainingCourseEntity } from './training-course.entity';
import { TrainingSessionEntity } from './training-session.entity';
import { TrainingEnrollmentEntity } from './training-enrollment.entity';

@Entity({ name: 'training_batches' })
export class TrainingBatchEntity extends CustomBaseEntity {
  @ManyToOne(() => TrainingCourseEntity, (course) => course.batches, { onDelete: 'CASCADE' })
  course: TrainingCourseEntity;

  @Column({ length: 150 })
  batchName: string; // e.g. "Batch 2083-Q1 (Audit Juniors)"

  @Column({ length: 30, default: 'in_person' })
  deliveryMode: 'in_person' | 'virtual' | 'hybrid' | 'self_paced';

  @Column({ nullable: true })
  venueOrLink: string; // Meeting Room / Teams / Google Meet link

  @Column({ type: 'int', default: 30 })
  maxCapacity: number;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  internalTrainer: UserEntity;

  @Column({ nullable: true })
  externalTrainerName: string;

  @Column({ nullable: true })
  externalTrainerOrg: string;

  @Column({ type: 'date' })
  startDate: string; // YYYY-MM-DD (AD)

  @Column({ type: 'date' })
  endDate: string; // YYYY-MM-DD (AD)

  @Column({ nullable: true })
  startDateNepali: string; // YYYY-MM-DD (BS)

  @Column({ nullable: true })
  endDateNepali: string; // YYYY-MM-DD (BS)

  @Column({ length: 20, default: 'scheduled' })
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  @OneToMany(() => TrainingSessionEntity, (session) => session.batch, { cascade: true })
  sessions: TrainingSessionEntity[];

  @OneToMany(() => TrainingEnrollmentEntity, (enrollment) => enrollment.batch)
  enrollments: TrainingEnrollmentEntity[];
}

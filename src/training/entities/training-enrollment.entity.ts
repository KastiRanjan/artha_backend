import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, Unique } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TrainingBatchEntity } from './training-batch.entity';
import { TrainingCourseEntity } from './training-course.entity';
import { TrainingAttendanceEntity } from './training-attendance.entity';
import { TrainingFeedbackEntity } from './training-feedback.entity';
import { TrainingLessonProgressEntity } from './training-lesson-progress.entity';

@Entity({ name: 'training_enrollments' })
@Unique(['batch', 'user'])
export class TrainingEnrollmentEntity extends CustomBaseEntity {
  @ManyToOne(() => TrainingBatchEntity, (batch) => batch.enrollments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  batch?: TrainingBatchEntity;

  @Column({ type: 'uuid', nullable: true })
  courseId?: string;

  @ManyToOne(() => TrainingCourseEntity, (course) => course.enrollments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course?: TrainingCourseEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ length: 20, default: 'self' })
  enrollmentType: 'self' | 'nominated';

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  nominatedBy: UserEntity;

  @Column({ length: 25, default: 'enrolled' })
  status: 'enrolled' | 'waitlisted' | 'completed' | 'failed' | 'dropped';

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  quizScore: number;

  @Column({ default: false })
  isPassed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ length: 50, nullable: true, unique: true })
  certificateNumber: string; // e.g. "CERT-2083-0042"

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  progressPercent: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  lastLessonId?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastReminderSentAt?: Date;

  @OneToMany(() => TrainingAttendanceEntity, (attendance) => attendance.enrollment)
  attendances: TrainingAttendanceEntity[];

  @OneToOne(() => TrainingFeedbackEntity, (feedback) => feedback.enrollment)
  feedback: TrainingFeedbackEntity;

  @OneToMany(() => TrainingLessonProgressEntity, (progress) => progress.enrollment)
  lessonProgresses: TrainingLessonProgressEntity[];
}

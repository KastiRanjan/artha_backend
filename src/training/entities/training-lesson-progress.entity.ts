import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingEnrollmentEntity } from './training-enrollment.entity';
import { TrainingLessonEntity } from './training-lesson.entity';

export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

@Entity({ name: 'training_lesson_progress' })
@Unique(['enrollmentId', 'lessonId'])
export class TrainingLessonProgressEntity extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  enrollmentId: string;

  @ManyToOne(() => TrainingEnrollmentEntity, (e) => e.lessonProgresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: TrainingEnrollmentEntity;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => TrainingLessonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: TrainingLessonEntity;

  @Column({ length: 20, default: 'not_started' })
  status: LessonProgressStatus;

  @Column({ type: 'int', default: 0 })
  lastPositionSeconds: number;

  @Column({ type: 'int', default: 0 })
  watchedSeconds: number;

  @Column({ type: 'int', default: 0 })
  timeSpentSeconds: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercent: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}

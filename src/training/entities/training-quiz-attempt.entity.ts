import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingEnrollmentEntity } from './training-enrollment.entity';
import { TrainingLessonEntity } from './training-lesson.entity';

@Entity({ name: 'training_quiz_attempts' })
export class TrainingQuizAttemptEntity extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  enrollmentId: string;

  @ManyToOne(() => TrainingEnrollmentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: TrainingEnrollmentEntity;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => TrainingLessonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: TrainingLessonEntity;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scorePercent: number;

  @Column({ default: false })
  passed: boolean;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  answers: Record<string, string[]>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;
}

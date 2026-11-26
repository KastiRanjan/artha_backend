import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingLessonEntity } from './training-lesson.entity';
import { TrainingEnrollmentEntity } from './training-enrollment.entity';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

@Entity({ name: 'training_quiz_questions' })
export class TrainingQuizQuestionEntity extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => TrainingLessonEntity, (lesson) => lesson.quizQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lessonId' })
  lesson: TrainingLessonEntity;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ length: 20, default: 'single' })
  questionType: 'single' | 'multiple';

  @Column({ type: 'jsonb', default: () => "'[]'" })
  options: QuizOption[];

  @Column({ type: 'int', default: 1 })
  points: number;

  @Column({ type: 'int', default: 1 })
  sortOrder: number;
}

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
}

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingLessonEntity } from './training-lesson.entity';

export interface QuizOptionItem {
  id: string;
  text: string;
}

@Entity({ name: 'training_quiz_questions' })
export class TrainingQuizQuestionEntity extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => TrainingLessonEntity, (l) => l.quizQuestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lessonId' })
  lesson: TrainingLessonEntity;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  options: QuizOptionItem[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  correctOptionIds: string[];

  @Column({ default: false })
  isMultiSelect: boolean;

  @Column({ type: 'int', default: 1 })
  points: number;

  @Column({ type: 'int', default: 1 })
  sortOrder: number;
}

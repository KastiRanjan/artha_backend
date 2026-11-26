import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingModuleEntity } from './training-module.entity';
import { TrainingQuizQuestionEntity } from './training-quiz.entity';
import { TrainingLessonCommentEntity } from './training-lesson-comment.entity';

export type TrainingLessonContentType =
  | 'video'
  | 'pdf'
  | 'document'
  | 'rich_text'
  | 'quiz';

@Entity({ name: 'training_lessons' })
export class TrainingLessonEntity extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => TrainingModuleEntity, (mod) => mod.lessons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: TrainingModuleEntity;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 30, default: 'rich_text' })
  contentType: TrainingLessonContentType;

  /**
   * Relative path inside private storage (never exposed via static public URL).
   */
  @Column({ type: 'text', nullable: true })
  filePath?: string;

  @Column({ length: 255, nullable: true })
  originalFileName?: string;

  @Column({ length: 120, nullable: true })
  mimeType?: string;

  @Column({ type: 'int', nullable: true })
  fileSizeBytes?: number;

  @Column({ type: 'text', nullable: true })
  richTextContent?: string;

  @Column({ type: 'int', default: 10 })
  durationMinutes: number;

  @Column({ type: 'int', default: 0 })
  durationSeconds: number;

  @Column({ type: 'int', default: 1 })
  sortOrder: number;

  @Column({ default: true })
  isRequired: boolean;

  @Column({ type: 'int', nullable: true })
  passingScore?: number;

  @OneToMany(() => TrainingQuizQuestionEntity, (q) => q.lesson, {
    cascade: true,
  })
  quizQuestions: TrainingQuizQuestionEntity[];

  @OneToMany(() => TrainingLessonCommentEntity, (c) => c.lesson)
  comments: TrainingLessonCommentEntity[];
}

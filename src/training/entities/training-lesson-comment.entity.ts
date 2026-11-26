import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TrainingLessonEntity } from './training-lesson.entity';

@Entity({ name: 'training_lesson_comments' })
export class TrainingLessonCommentEntity extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => TrainingLessonEntity, (lesson) => lesson.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'lessonId' })
  lesson: TrainingLessonEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @Column({ type: 'text' })
  content: string;
}

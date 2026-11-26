import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingCourseEntity } from './training-course.entity';
import { TrainingLessonEntity } from './training-lesson.entity';

@Entity({ name: 'training_modules' })
export class TrainingModuleEntity extends CustomBaseEntity {
  @Column({ type: 'uuid' })
  courseId: string;

  @ManyToOne(() => TrainingCourseEntity, (course) => course.modules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: TrainingCourseEntity;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 1 })
  sortOrder: number;

  @Column({ default: true })
  isPublished: boolean;

  @OneToMany(() => TrainingLessonEntity, (lesson) => lesson.module, {
    cascade: true,
  })
  lessons: TrainingLessonEntity[];
}

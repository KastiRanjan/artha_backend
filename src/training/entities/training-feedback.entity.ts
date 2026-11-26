import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TrainingEnrollmentEntity } from './training-enrollment.entity';

@Entity({ name: 'training_feedbacks' })
export class TrainingFeedbackEntity extends CustomBaseEntity {
  @OneToOne(() => TrainingEnrollmentEntity, (enrollment) => enrollment.feedback, { onDelete: 'CASCADE' })
  @JoinColumn()
  enrollment: TrainingEnrollmentEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ type: 'int', default: 5 })
  contentRating: number; // 1-5

  @Column({ type: 'int', default: 5 })
  trainerRating: number; // 1-5

  @Column({ type: 'int', default: 5 })
  overallRating: number; // 1-5

  @Column('text', { nullable: true })
  comment: string;

  @Column('text', { nullable: true })
  suggestions: string;
}

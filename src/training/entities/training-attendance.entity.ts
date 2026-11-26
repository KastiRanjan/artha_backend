import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TrainingSessionEntity } from './training-session.entity';
import { TrainingEnrollmentEntity } from './training-enrollment.entity';

@Entity({ name: 'training_attendances' })
@Unique(['session', 'user'])
export class TrainingAttendanceEntity extends CustomBaseEntity {
  @ManyToOne(() => TrainingSessionEntity, (session) => session.attendances, { onDelete: 'CASCADE' })
  session: TrainingSessionEntity;

  @ManyToOne(() => TrainingEnrollmentEntity, (enrollment) => enrollment.attendances, { onDelete: 'CASCADE' })
  enrollment: TrainingEnrollmentEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ length: 20, default: 'present' })
  status: 'present' | 'absent' | 'excused' | 'late';

  @Column({ type: 'varchar', nullable: true })
  remarks: string;

  @Column({ default: false })
  worklogSynced: boolean;
}

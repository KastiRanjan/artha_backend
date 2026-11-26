import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TrainingCourseEntity } from './training-course.entity';

export type AccessWindowMode = 'always' | 'allow_window' | 'ban_window';

@Entity({ name: 'training_access_policies' })
export class TrainingAccessPolicyEntity extends CustomBaseEntity {
  @Column({ type: 'uuid', unique: true })
  courseId: string;

  @OneToOne(() => TrainingCourseEntity, (course) => course.accessPolicy, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: TrainingCourseEntity;

  @Column({ length: 20, default: 'always' })
  mode: AccessWindowMode;

  /**
   * Days of week (0 = Sunday .. 6 = Saturday) when the allow/ban rule applies.
   * Empty/null means all days of the week.
   */
  @Column({ type: 'jsonb', default: () => "'[0,1,2,3,4,5,6]'" })
  allowedDays: number[];

  /**
   * HH:mm (24h) in configured timezone, e.g. "09:00"
   */
  @Column({ length: 10, nullable: true })
  startTime?: string;

  /**
   * HH:mm (24h) in configured timezone, e.g. "18:00"
   */
  @Column({ length: 10, nullable: true })
  endTime?: string;

  @Column({ length: 60, default: 'Asia/Kathmandu' })
  timezone: string;

  /**
   * Role names exempt from time restriction (e.g. superuser, admin)
   */
  @Column({ type: 'jsonb', default: () => "'[\"superuser\",\"administrator\",\"admin\"]'" })
  exemptRoles: string[];

  @Column({ type: 'date', nullable: true })
  validFromDate?: string;

  @Column({ type: 'date', nullable: true })
  validUntilDate?: string;

  @Column({ type: 'text', nullable: true })
  policyNote?: string;
}

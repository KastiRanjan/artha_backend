import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TrainingBatchEntity } from './training-batch.entity';
import { TrainingModuleEntity } from './training-module.entity';
import { TrainingAccessPolicyEntity } from './training-access-policy.entity';
import { TrainingEnrollmentEntity } from './training-enrollment.entity';

@Entity({ name: 'training_courses' })
export class TrainingCourseEntity extends CustomBaseEntity {
  @Column({ length: 30, unique: true })
  code: string; // e.g. "TRN-AUD-001"

  @Column({ length: 255 })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 60 })
  category: string; // e.g. "Audit", "Taxation", "NFRS/NAS", "Compliance", "Tools/Excel", "Leadership"

  @Column({ length: 20, default: 'beginner' })
  level: 'beginner' | 'intermediate' | 'advanced';

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 0 })
  cpdHours: number; // Continuing Professional Development credit hours

  @Column({ type: 'int', default: 60 })
  durationMinutes: number;

  @Column({ type: 'simple-array', nullable: true })
  targetRoles: string[]; // e.g. ['auditjunior', 'auditsenior', 'all']

  @Column({ default: false })
  isMandatory: boolean;

  @Column('text', { nullable: true })
  prerequisites: string;

  @Column('text', { nullable: true })
  materialsUrl: string;

  @Column({ length: 20, default: 'active' })
  status: 'active' | 'draft' | 'archived';

  @Column({ length: 25, default: 'self_paced' })
  courseType: 'self_paced' | 'instructor_led' | 'hybrid';

  @Column({ default: false })
  allowSelfEnrollment: boolean;

  @Column({ default: true })
  strictSystemOnly: boolean;

  @Column({ default: false })
  sequentialLock: boolean;

  @Column({ type: 'int', default: 70 })
  passingScore: number;

  @Column({ type: 'uuid', nullable: true })
  instructorId?: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'instructorId' })
  instructor?: UserEntity;

  @OneToMany(() => TrainingBatchEntity, (batch) => batch.course)
  batches: TrainingBatchEntity[];

  @OneToMany(() => TrainingModuleEntity, (mod) => mod.course, { cascade: true })
  modules: TrainingModuleEntity[];

  @OneToOne(() => TrainingAccessPolicyEntity, (policy) => policy.course, {
    cascade: true,
  })
  accessPolicy?: TrainingAccessPolicyEntity;

  @OneToMany(() => TrainingEnrollmentEntity, (enrollment) => enrollment.course)
  enrollments: TrainingEnrollmentEntity[];
}

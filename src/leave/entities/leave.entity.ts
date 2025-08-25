import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';

export type LeaveStatus = 'pending' | 'approved_by_lead' | 'approved_by_pm' | 'approved' | 'rejected';

@Entity('leaves')
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 30 })
  type: string; // e.g., sick, casual, unpaid

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: LeaveStatus;

  @Column({ type: 'uuid', nullable: true })
  leadApproverId?: string;

  @Column({ type: 'uuid', nullable: true })
  pmApproverId?: string;

  @Column({ type: 'uuid', nullable: true })
  adminApproverId?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

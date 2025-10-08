import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { LeaveType } from 'src/leave-type/entities/leave-type.entity';

export type LeaveStatus = 'pending' | 'approved_by_manager' | 'approved' | 'rejected';

@Entity('leaves')
export class Leave {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  user: UserEntity;

  @ManyToOne(() => LeaveType, { eager: true })
  leaveType: LeaveType;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'varchar', length: 30 })
  type: string; // Legacy field - kept for backward compatibility

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: LeaveStatus;

  @Column({ type: 'boolean', default: false })
  isCustomDates: boolean;

  @Column({ type: 'json', nullable: true })
  customDates?: string[];

  @Column({ type: 'uuid', nullable: true })
  requestedManagerId: string;

  @Column({ type: 'uuid', nullable: true })
  managerApproverId?: string;

  @Column({ type: 'uuid', nullable: true })
  adminApproverId?: string;

  // Relations for displaying user names
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'requestedManagerId' })
  requestedManager?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'managerApproverId' })
  managerApprover?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'adminApproverId' })
  adminApprover?: UserEntity;

  @Column({ type: 'timestamp', nullable: true })
  managerApprovalTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  adminApprovalTime?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

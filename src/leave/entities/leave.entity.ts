import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { LeaveType } from 'src/leave-type/entities/leave-type.entity';

export type LeaveStatus =
  | 'pending'
  | 'clarification_requested'
  | 'approved_by_manager'
  | 'approved'
  | 'rejected';

export type FractionalType = 'first_half' | 'second_half' | 'custom_hours';

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

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: LeaveStatus;

  @Column({ type: 'boolean', default: false })
  isCustomDates: boolean;

  @Column({ type: 'json', nullable: true })
  customDates?: string[];

  // Fractional Leave Support
  @Column({ type: 'boolean', default: false })
  isFractional: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fractionalType?: FractionalType;

  @Column({ type: 'time', nullable: true })
  startTime?: string;

  @Column({ type: 'time', nullable: true })
  endTime?: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true, default: null })
  fractionalDuration?: number;

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

  // Clarification Support
  @Column({ type: 'text', nullable: true })
  clarificationNotes?: string;

  @Column({ type: 'text', nullable: true })
  clarificationResponse?: string;

  @Column({ type: 'uuid', nullable: true })
  clarificationRequestedById?: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'clarificationRequestedById' })
  clarificationRequestedBy?: UserEntity;

  @Column({ type: 'timestamp', nullable: true })
  clarificationRequestedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  clarificationRespondedAt?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

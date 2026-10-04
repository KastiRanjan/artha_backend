import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { LeaveType } from 'src/leave-type/entities/leave-type.entity';

export enum LeaveLedgerAction {
  ALLOCATION = 'ALLOCATION',
  CARRY_OVER = 'CARRY_OVER',
  LEAVE_RESERVATION = 'LEAVE_RESERVATION',
  LEAVE_CONSUMPTION = 'LEAVE_CONSUMPTION',
  LEAVE_CANCELLATION = 'LEAVE_CANCELLATION',
  LEAVE_REJECTION = 'LEAVE_REJECTION',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export enum LeaveLedgerChangeType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  HOLD = 'HOLD',
  RELEASE = 'RELEASE',
}

@Entity('leave_balance_ledgers')
export class LeaveBalanceLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Index()
  @Column({ type: 'uuid' })
  leaveTypeId: string;

  @ManyToOne(() => LeaveType, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leaveTypeId' })
  leaveType: LeaveType;

  @Column({ type: 'int' })
  year: number;

  @Column({
    type: 'enum',
    enum: LeaveLedgerAction,
  })
  action: LeaveLedgerAction;

  @Column({
    type: 'enum',
    enum: LeaveLedgerChangeType,
  })
  changeType: LeaveLedgerChangeType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  days: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  resultingBalance: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceId?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ type: 'uuid', nullable: true })
  createdById?: string;

  @CreateDateColumn()
  createdAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { LeaveType } from 'src/leave-type/entities/leave-type.entity';

@Entity('user_leave_balances')
@Unique(['user', 'leaveType', 'year'])
export class UserLeaveBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => LeaveType, { eager: true })
  @JoinColumn({ name: 'leaveTypeId' })
  leaveType: LeaveType;

  @Column({ type: 'uuid' })
  leaveTypeId: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  allocatedDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  carriedOverDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  usedDays: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  pendingDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed field - not stored in DB
  get totalAvailableDays(): number {
    return Number(this.allocatedDays) + Number(this.carriedOverDays);
  }

  get remainingDays(): number {
    return this.totalAvailableDays - Number(this.usedDays) - Number(this.pendingDays);
  }
}

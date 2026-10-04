import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { DsaExpenseItem } from './dsa-expense-item.entity';

export enum DsaStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  VERIFIED = 'verified',
}

export enum DsaType {
  LODGING = 'lodging',
  TRANSPORT = 'transport',
  BOTH = 'both',
}

@Entity()
export class Dsa extends CustomBaseEntity {
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requesterId' })
  requester: UserEntity;

  @Column()
  requesterId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: UserEntity;

  @Column({ nullable: true })
  requestedById: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  requestedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedAmount: number;

  // Explicit Financial Pipeline Fields (Advance vs Claims)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  advanceRequestedAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  advanceApprovedAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalClaimedAmount?: number;

  // Positive: Company pays employee; Negative: Employee refunds company
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  netSettlementAmount?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  idempotencyKey?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: UserEntity;

  @Column({ nullable: true })
  approvedById: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({
    type: 'enum',
    enum: DsaStatus,
    default: DsaStatus.REQUESTED,
  })
  status: DsaStatus;

  @Column({
    type: 'enum',
    enum: DsaType,
  })
  type: DsaType;

  @Column('text', { nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  settlementAmount: number;

  @Column('text', { nullable: true })
  billDetails: string;

  @Column('text', { nullable: true })
  billImage: string;

  @Column({ type: 'timestamp', nullable: true })
  settledAt: Date;

  @OneToMany(() => DsaExpenseItem, (item) => item.dsa, { cascade: true })
  expenseItems: DsaExpenseItem[];

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'verifiedById' })
  verifiedBy: UserEntity;

  @Column({ nullable: true })
  verifiedById: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column('text', { nullable: true })
  adminRemarks: string;
}

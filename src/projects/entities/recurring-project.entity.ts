import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { NatureOfWork } from 'src/nature-of-work/entities/nature-of-work.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

export type RecurrenceFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';

@Entity()
export class RecurringProject extends CustomBaseEntity {
  @Column({ length: 120 })
  namePattern: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => NatureOfWork, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'natureOfWorkId' })
  natureOfWork?: NatureOfWork;

  @Column({ type: 'uuid' })
  natureOfWorkId: string;

  @Column({ type: 'uuid', nullable: true })
  natureOfWorkGroupId?: string;

  @Column({
    type: 'enum',
    enum: ['monthly', 'quarterly', 'semi_annual', 'yearly'],
    default: 'monthly',
  })
  frequency: RecurrenceFrequency;

  @Column({ type: 'date' })
  nextRunDate: Date;

  @Column({ type: 'int', default: 30 })
  durationDays: number;

  @Column({ type: 'uuid', nullable: true })
  projectLeadId?: string;

  @Column({ type: 'uuid', nullable: true })
  projectManagerId?: string;

  @Column({ type: 'simple-array', nullable: true })
  userIds?: string[];

  @Column({ type: 'uuid', nullable: true })
  workingYearId?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  lastCreatedProjectId?: string;
}

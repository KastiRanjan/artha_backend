import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('leave_types')
export class LeaveType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', nullable: true })
  maxDaysPerYear?: number; // null means unlimited

  @Column({ type: 'boolean', default: false })
  isEmergency: boolean; // Emergency leaves can be requested for today

  @Column({ type: 'boolean', default: false })
  allowCarryOver: boolean; // Can unused days be carried to next year

  @Column({ type: 'int', nullable: true })
  maxCarryOverDays?: number; // Max days that can be carried over (null means all unused days)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

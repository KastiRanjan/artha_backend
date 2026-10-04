import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Dsa } from './dsa.entity';

export enum DsaExpenseCategory {
  LODGING = 'lodging',
  TRANSPORT = 'transport',
  MEAL = 'meal',
  INCIDENTALS = 'incidentals',
  OTHER = 'other',
}

@Entity('dsa_expense_items')
export class DsaExpenseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  dsaId: string;

  @ManyToOne(() => Dsa, (dsa) => dsa.expenseItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dsaId' })
  dsa: Dsa;

  @Column({
    type: 'enum',
    enum: DsaExpenseCategory,
    default: DsaExpenseCategory.OTHER,
  })
  category: DsaExpenseCategory;

  @Column({ type: 'date' })
  expenseDate: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  receiptNumber?: string;

  @Column('text', { nullable: true })
  billImage?: string;

  @Column('text', { nullable: true })
  remarks?: string;

  @CreateDateColumn()
  createdAt: Date;
}

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity({ name: 'access_log' })
export class AccessLog extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: true, length: 100 })
  userId: string;

  @Column({ nullable: true, length: 200 })
  userName: string;

  @Column({ nullable: true, length: 200 })
  userEmail: string;

  @Column({ nullable: true, length: 50 })
  ipAddress: string;

  @Column({ nullable: true, length: 1000 })
  userAgent: string;

  @Column({ length: 10 })
  method: string;

  @Index()
  @Column({ length: 1000 })
  endpoint: string;

  @Index()
  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'int' })
  durationMs: number;

  @Index()
  @Column({ default: false })
  isHeavyOperation: boolean;

  @Column({ type: 'jsonb', nullable: true })
  requestQuery: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  requestBody: Record<string, any>;

  @Column({ nullable: true, length: 500 })
  action: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity({ name: 'error_log' })
export class ErrorLog extends BaseEntity {
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

  @Index()
  @Column({ nullable: true, length: 1000 })
  endpoint: string;

  @Column({ nullable: true, length: 10 })
  method: string;

  @Column({ type: 'int', default: 500 })
  statusCode: number;

  @Index()
  @Column({ nullable: true, length: 200 })
  errorName: string;

  @Column({ type: 'text' })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  stackTrace: string;

  @Column({ type: 'jsonb', nullable: true })
  requestPayload: Record<string, any>;

  @Column({ nullable: true, length: 200 })
  context: string;

  @Index()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}

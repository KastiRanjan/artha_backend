import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Project } from 'src/projects/entities/project.entity';

export enum ReportAccessStatus {
  PENDING = 'pending',       // Uploaded but payment not done
  ACCESSIBLE = 'accessible', // Payment done, can download
  REVOKED = 'revoked'        // Access revoked
}

@Entity()
export class ClientReport extends CustomBaseEntity {
  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 255 })
  originalFileName: string;

  @Column({ length: 100, nullable: true })
  fileType: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn()
  customer: Customer;

  @Column()
  customerId: string;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @Column({
    type: 'enum',
    enum: ReportAccessStatus,
    default: ReportAccessStatus.PENDING
  })
  accessStatus: ReportAccessStatus;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ type: 'timestamp', nullable: true })
  accessGrantedAt: Date;

  @Column({ nullable: true })
  accessGrantedBy: string;

  @Column({ type: 'text', nullable: true })
  accessNotes: string;

  @Column({ nullable: true })
  fiscalYear: number;
}

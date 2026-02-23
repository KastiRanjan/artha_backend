import { Column, Entity, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ClientReportDocumentType } from 'src/client-report-document-type/entities/client-report-document-type.entity';
import { ClientReportFile } from './client-report-file.entity';

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

  // Keep legacy single-file columns as nullable for backward compatibility with existing data
  @Column({ length: 500, nullable: true })
  filePath: string;

  @Column({ length: 255, nullable: true })
  originalFileName: string;

  @Column({ length: 100, nullable: true })
  fileType: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ length: 255, nullable: true })
  displayFileName: string;

  // New: One report can have multiple files
  @OneToMany(() => ClientReportFile, (file) => file.report, { cascade: true, eager: true })
  files: ClientReportFile[];

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: string;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ nullable: true })
  projectId: string;

  @ManyToOne(() => ClientReportDocumentType, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  documentType: ClientReportDocumentType;

  @Column({
    type: 'enum',
    enum: ReportAccessStatus,
    default: ReportAccessStatus.PENDING
  })
  accessStatus: ReportAccessStatus;

  @Column({ default: false })
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

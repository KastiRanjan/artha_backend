import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { ClientReport } from './client-report.entity';

@Entity()
export class ClientReportFile extends CustomBaseEntity {
  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 255 })
  originalFileName: string;

  @Column({ length: 255, nullable: true })
  displayFileName: string;

  @Column({ length: 100, nullable: true })
  fileType: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @ManyToOne(() => ClientReport, (report) => report.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: ClientReport;

  @Column()
  reportId: string;
}

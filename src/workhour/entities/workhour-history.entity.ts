import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workhour_history')
export class WorkhourHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roleId: string;

  @Column({ type: 'uuid', nullable: true })
  previousWorkHourId: string;

  @Column({ type: 'int', default: 8 })
  workHours: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  startTime?: string; // e.g., "09:00"

  @Column({ type: 'varchar', length: 10, nullable: true })
  endTime?: string; // e.g., "17:00"

  @Column({ type: 'date', nullable: true })
  validFrom: Date;

  @Column({ type: 'date', nullable: true })
  validUntil: Date;  // When a new workhour is created, the previous one's validUntil is set

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workhours')
export class Workhour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  roleId?: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'int', default: 8 })
  workHours: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  startTime?: string; // e.g., "09:00"

  @Column({ type: 'varchar', length: 10, nullable: true })
  endTime?: string; // e.g., "17:00"

  @Column({ type: 'date', nullable: true })
  validFrom?: Date;

  @Column({ type: 'date', nullable: true })
  validTo?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

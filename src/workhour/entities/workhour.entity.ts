import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workhours')
export class Workhour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  roleId: string;

  @Column({ type: 'int', default: 8 })
  workHours: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  startTime?: string; // e.g., "09:00"

  @Column({ type: 'varchar', length: 10, nullable: true })
  endTime?: string; // e.g., "17:00"

  @Column({ type: 'date', nullable: false })
  validFrom: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;  // To mark current active workhour for a role

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

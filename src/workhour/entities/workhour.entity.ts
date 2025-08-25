import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workhours')
export class Workhour {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  role?: string; // e.g., Developer, Intern

  @Column({ type: 'uuid', nullable: true })
  userId?: string; // If set, overrides role default

  @Column({ type: 'int', default: 8 })
  hours: number; // Default work hours

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

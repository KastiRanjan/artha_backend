import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('calendar')
export class Calendar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string; // AD date

  @Column({ type: 'varchar', length: 20, nullable: true })
  bsDate?: string; // BS date (optional)

  @Column({ type: 'varchar', length: 20, nullable: true })
  dayOfWeek?: string; // e.g., Sunday, Monday

  @Column({ type: 'boolean', default: false })
  isHoliday: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  holidayTitle?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  holidayType?: string;
}

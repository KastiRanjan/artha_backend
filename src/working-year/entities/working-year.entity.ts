import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('working_years')
export class WorkingYear extends CustomBaseEntity {
  @Column({ unique: true })
  name: string; // e.g. "2081/82", "2082/83"

  @Column({ type: 'int' })
  nepaliStartYear: number; // e.g. 2081

  @Column({ type: 'int', default: 5 })
  nepaliStartMonth: number; // 1 to 12. Default: 5 (Bhadra)

  @Column({ type: 'int', default: 1 })
  nepaliStartDay: number; // Default: 1 (1st of Bhadra)

  @Column({ type: 'date' })
  startDateAD: Date; // Converted Gregorian start date

  @Column({ type: 'date' })
  endDateAD: Date; // Converted Gregorian end date

  @Column({ default: false })
  isCurrent: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;
}

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity } from 'typeorm';

@Entity('working_year_configs')
export class WorkingYearConfig extends CustomBaseEntity {
  @Column({ type: 'int', default: 5 })
  defaultStartMonth: number; // 5 = Bhadra

  @Column({ type: 'int', default: 1 })
  defaultStartDay: number; // 1 = 1st of month

  @Column({ type: 'varchar', length: 100, default: 'Bhadra 1' })
  description: string;
}

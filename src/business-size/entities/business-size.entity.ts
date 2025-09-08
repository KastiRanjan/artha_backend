import { Column, Entity } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';

@Entity()
export class BusinessSize extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  shortName: string;

  @Column({ default: true })
  isActive: boolean;
}

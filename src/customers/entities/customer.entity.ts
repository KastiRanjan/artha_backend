import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity()
@Unique(['email'])
export class Customer extends CustomBaseEntity {
  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 15, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ length: 50, nullable: true })
  country?: string;

  @Column({ length: 10, nullable: true })
  postalCode?: string;

  @Column({ nullable: true })
  organization?: string;
}

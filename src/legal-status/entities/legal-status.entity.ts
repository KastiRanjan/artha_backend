import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Customer } from 'src/customers/entities/customer.entity';

@Entity()
export class LegalStatus extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active'
  })
  status: string;

  @OneToMany(() => Customer, (customer) => customer.legalStatus)
  customers: Customer[];
}

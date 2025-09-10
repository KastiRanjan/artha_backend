import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class PortalCredential extends CustomBaseEntity {
  @Column({ length: 100 })
  portalName: string;

  @Column({ length: 100 })
  loginUser: string;

  @Column({ length: 100 })
  password: string;
  
  @Column({ nullable: true })
  website: string;
  
  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active'
  })
  status: string;

  @ManyToOne(() => Customer, (customer) => customer.portalCredentials, {
    onDelete: 'CASCADE',
  })
  customer: Customer;
}

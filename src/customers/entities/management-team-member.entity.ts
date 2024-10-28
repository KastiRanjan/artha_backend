import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';

@Entity()
export class ManagementTeamMember extends CustomBaseEntity {
  @ManyToOne(() => Customer, (customer) => customer.managementTeamMembers)
  customer: Customer;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  designation: string;

  @Column({ length: 15, nullable: true })
  mobileNo?: string;

  @Column({ length: 15, nullable: true })
  telephoneNo?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ length: 10, nullable: true })
  extNo?: string;

  @Column({ length: 100, nullable: true })
  department?: string;

  toString() {
    return `${this.name} - ${this.designation} (${this.customer.name})`;
  }
}

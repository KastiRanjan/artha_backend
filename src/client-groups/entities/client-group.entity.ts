import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { GroupContact } from './group-contact.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Entity()
export class ClientGroup extends CustomBaseEntity {
  @Column({ length: 150, unique: true })
  name: string;

  @Column({ length: 30, nullable: true })
  code: string;

  @Column({ length: 150, nullable: true })
  primaryContactPerson?: string;

  @Column({ length: 30, nullable: true })
  primaryPhone?: string;

  @Column({ length: 100, nullable: true })
  primaryEmail?: string;

  @Column({ length: 255, nullable: true })
  headOfficeAddress?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive'],
    default: 'active'
  })
  status: string;

  @Column({ nullable: true })
  partnerInChargeId?: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'partnerInChargeId' })
  partnerInCharge?: UserEntity;

  @OneToMany(() => Customer, (customer) => customer.clientGroup)
  customers: Customer[];

  @OneToMany(() => GroupContact, (contact) => contact.clientGroup, { cascade: true })
  contacts: GroupContact[];

  toString() {
    return this.name;
  }
}

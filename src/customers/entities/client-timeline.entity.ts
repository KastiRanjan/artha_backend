import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Customer } from './customer.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Entity()
export class ClientTimeline extends CustomBaseEntity {
  @ManyToOne(() => Customer, (customer) => customer.timelines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column()
  customerId: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity;

  @Column({ nullable: true })
  userId?: string;

  @Column({ length: 80, default: 'company_update' })
  eventType: string;

  @Column({ length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  eventDate: Date;

  @Column({ default: false })
  isManual: boolean;
}

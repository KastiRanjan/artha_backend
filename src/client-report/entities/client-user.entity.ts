import { Column, Entity, ManyToMany, JoinTable, Index } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

export enum ClientUserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

@Entity()
export class ClientUser extends CustomBaseEntity {
  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  salt: string;

  @Column({ length: 20, nullable: true })
  phoneNumber: string;

  // Many-to-many relationship: a client user can be associated with multiple clients
  @ManyToMany(() => Customer, { eager: true })
  @JoinTable({
    name: 'client_user_customers',
    joinColumn: { name: 'client_user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' }
  })
  customers: Customer[];

  // Currently selected customer for the session (not persisted, set during login)
  selectedCustomerId?: string;

  @Column({
    type: 'enum',
    enum: ClientUserStatus,
    default: ClientUserStatus.ACTIVE
  })
  status: ClientUserStatus;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  token: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenValidityDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Exclude({ toPlainOnly: true })
  skipHashPassword = false;

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }

  async hashPassword() {
    this.salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, this.salt);
  }
}

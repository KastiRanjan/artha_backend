import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ClientGroup } from './client-group.entity';

@Entity()
export class GroupContact extends CustomBaseEntity {
  @ManyToOne(() => ClientGroup, (group) => group.contacts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientGroupId' })
  clientGroup: ClientGroup;

  @Column()
  clientGroupId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 100 })
  designation: string;

  @Column({ length: 100, nullable: true })
  department?: string;

  @Column({ length: 30, nullable: true })
  mobileNo?: string;

  @Column({ length: 30, nullable: true })
  telephoneNo?: string;

  @Column({ length: 100, nullable: true })
  email?: string;

  @Column({ length: 15, nullable: true })
  extNo?: string;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  toString() {
    return `${this.name} - ${this.designation}`;
  }
}

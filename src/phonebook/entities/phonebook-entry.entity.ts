import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { RoleEntity } from 'src/role/entities/role.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { PhonebookCategory } from './phonebook-category.entity';
import { PhonebookHistory } from './phonebook-history.entity';

@Entity('phonebook_entries')
export class PhonebookEntry extends CustomBaseEntity {
  @Column({ length: 150 })
  name: string;

  @Column({ length: 40 })
  phoneNumber: string;

  @Column({ length: 40, nullable: true })
  secondaryPhone?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => PhonebookCategory, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: PhonebookCategory;

  @Column({ default: true })
  isShared: boolean;

  @ManyToMany(() => UserEntity, { nullable: true })
  @JoinTable({
    name: 'phonebook_shared_users',
    joinColumn: { name: 'entryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' }
  })
  sharedWithUsers: UserEntity[];

  @ManyToMany(() => RoleEntity, { nullable: true })
  @JoinTable({
    name: 'phonebook_shared_roles',
    joinColumn: { name: 'entryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' }
  })
  sharedWithRoles: RoleEntity[];

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator?: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updatedBy' })
  updater?: UserEntity;

  @OneToMany(() => PhonebookHistory, (history) => history.entry)
  histories: PhonebookHistory[];
}

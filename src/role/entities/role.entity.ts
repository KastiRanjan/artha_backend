import {
  Column,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  Unique
} from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { PermissionEntity } from 'src/permission/entities/permission.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Entity({
  name: 'role'
})
@Unique(['name'])
export class RoleEntity extends CustomBaseEntity {
  @Column('varchar', { length: 100, unique: true })
  name: string;

  @Column('varchar', { length: 100, unique: true })
  displayName: string;

  @Column('varchar')
  description: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  user: UserEntity;

  @ManyToMany(() => PermissionEntity, (permission) => permission.role)
  @JoinTable({
    name: 'role_permission',
    joinColumn: {
      name: 'roleId',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'permissionId',
      referencedColumnName: 'id'
    }
  })
  permission: PermissionEntity[];

  constructor(data?: Partial<RoleEntity>) {
    super();
    if (data) {
      Object.assign(this, data);
    }
  }
}

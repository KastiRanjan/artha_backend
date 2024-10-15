import { Entity, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User profile Entity
 */
@Entity({
  name: 'user_profile'
})
export class UserProfileEntity extends CustomBaseEntity {
  @OneToOne(() => UserEntity, (user) => user.profile)
  user: UserEntity;
}

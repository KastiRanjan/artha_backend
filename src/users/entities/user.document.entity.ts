import { Entity, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User Document Entity
 */
@Entity({
  name: 'user_document'
})
export class UserDocumentEntity extends CustomBaseEntity {
  @OneToOne(() => UserEntity, (user) => user.document)
  user: UserEntity;
}

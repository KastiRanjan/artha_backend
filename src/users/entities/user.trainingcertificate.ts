import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User Document Entity
 */
@Entity({
  name: 'user_document'
})
export class UserDocumentEntity extends CustomBaseEntity {

  @Column({ type: 'date' })
  date: Date;

  @Column({ length: 100 })
  filename: string;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;

  @ManyToOne(() => UserEntity, (user) => user.document)
  user: UserEntity;
}

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

  @Column({ type: 'enum', enum: ['citizenship', 'passport', 'driving_license', 'pan_no', 'membership', 'others'] })
  documentType: string;

  @Column({ length: 50 })
  identificationNo: string;

  @Column({ type: 'date' })
  dateOfIssue: Date;

  @Column({ length: 100 })
  placeOfIssue: string;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;

  @ManyToOne(() => UserEntity, (user) => user.document)
  user: UserEntity;
}

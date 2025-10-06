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
  @Column({
    type: 'enum',
    enum: [
      'citizenship',
      'passport',
      'driving_license',
      'pan_no',
      'membership',
      'others'
    ],
    nullable: true
  })
  documentType: string;

  @Column({ length: 50, nullable: true })
  identificationNo: string;

  @Column({ type: 'date', nullable: true })
  dateOfIssue: Date;

  @Column({ length: 100, nullable: true })
  placeOfIssue: string;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;
  
  @Column({ type: 'varchar', nullable: true })
  filename: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;
  
  @Column({ nullable: true })
  verifiedById: string;
  
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.document)
  user: UserEntity;
}

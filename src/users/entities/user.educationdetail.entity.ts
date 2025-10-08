import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User Education Detail Entity
 */
@Entity({
  name: 'user_education'
})
export class UserEducationDetailEntity extends CustomBaseEntity {
  @Column({ length: 100, nullable: true })
  universityCollege: string;

  @Column({ length: 100, nullable: true })
  faculty: string;

  @Column({ nullable: true })
  yearOfPassing: number;

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

  @ManyToOne(() => UserEntity, (user) => user.education_detail)
  user: UserEntity;
}

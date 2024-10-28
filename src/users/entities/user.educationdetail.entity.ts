import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User Document Entity
 */
@Entity({
  name: 'user_education'
})
export class UserEducationDetailEntity extends CustomBaseEntity {
  @Column({ length: 100,nullable: true })
  universityCollege: string;

  @Column({ length: 100,nullable: true })
  faculty: string;

  @Column({nullable: true })
  yearOfPassing: number;

  @Column({ length: 100,nullable: true })
  placeOfIssue: string;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;

  @ManyToOne(() => UserEntity, (user) => user.document)
  user: UserEntity;
}

import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User Training Certificate Entity
 */
@Entity({
  name: 'user_training'
})
export class UserTrainningEntity extends CustomBaseEntity {

  @ManyToOne(() => UserEntity, (user) => user.trainning_detail)
  user: UserEntity;

  @Column({ length: 100, nullable: true })
  institute: string;

  @Column({ length: 100, nullable: true })
  designationOfCourse: string;

  @Column({ type: 'int', nullable: true })
  year: number;

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
}

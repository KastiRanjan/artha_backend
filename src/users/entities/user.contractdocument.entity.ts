import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Entity({
  name: 'user_contract'
})
export class UserContractEntity extends CustomBaseEntity {
  @Column({ length: 100, nullable: true })
  filename: string;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;

  @Column({ type: 'timestamp', nullable: true })
  validityStartDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  validityEndDate: Date;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedById: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.contract_detail)
  user: UserEntity;
}

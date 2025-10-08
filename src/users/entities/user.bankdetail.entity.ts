import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User Bank Detail Entity
 */
@Entity({
  name: 'user_bank_detail'
})
export class UserBankDetailEntity extends CustomBaseEntity {
  @Column({ length: 100, nullable: true })
  bankName: string;

  @Column({ length: 100, nullable: true })
  bankBranch: string;

  @Column({ length: 20, nullable: true })
  accountNo: string;

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

  @ManyToOne(() => UserEntity, (user) => user.bank_detail)
  user: UserEntity;
}

import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

/**
 * User Document Entity
 */
@Entity({
  name: 'user_bank_detail'
})
export class UserBankDetailEntity extends CustomBaseEntity {

  @Column({ length: 100 })
  bankName: string;

  @Column({ length: 100 })
  bankBranch: string;

  @Column({ length: 20 })
  accountNo: string;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;

  @ManyToOne(() => UserEntity, (user) => user.bank_detail)
  user: UserEntity;
}

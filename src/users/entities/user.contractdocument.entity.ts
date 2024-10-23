import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Entity({
  name: 'user_contract'
})
export class UserContractEntity extends CustomBaseEntity {

  @Column({ length: 100 })
  filename: string;

  @Column({ type: 'varchar', nullable: true })
  documentFile: string;

  @ManyToOne(() => UserEntity, (user) => user.contract_detail)
  user: UserEntity;
}

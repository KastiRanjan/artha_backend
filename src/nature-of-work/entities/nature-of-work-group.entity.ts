import { Column, Entity, OneToMany } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { NatureOfWork } from './nature-of-work.entity';

@Entity()
export class NatureOfWorkGroup extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true, default: 0 })
  rank: number;

  @OneToMany(() => NatureOfWork, (now) => now.group, {
    nullable: true
  })
  natureOfWorks?: NatureOfWork[];
}

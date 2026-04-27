import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { NatureOfWorkGroup } from './nature-of-work-group.entity';

@Entity()
export class NatureOfWork extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  shortName: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => NatureOfWorkGroup, (group) => group.natureOfWorks, {
    onDelete: 'SET NULL',
    nullable: true
  })
  group?: NatureOfWorkGroup;

  @Column({ nullable: true, type: 'uuid' })
  groupId?: string;
}

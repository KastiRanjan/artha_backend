import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity()
export class TaskSuper extends CustomBaseEntity {
  @Column()
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({ nullable: true, default: 0 })
  rank: number;

  @OneToMany(() => TaskGroup, (taskGroup) => taskGroup.taskSuper, {
    nullable: true
  })
  taskGroups?: TaskGroup[];
}
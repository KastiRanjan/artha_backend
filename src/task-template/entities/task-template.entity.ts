import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import {
    Column,
    Entity, ManyToOne, Unique
} from 'typeorm';

@Entity()
@Unique(['name'])
export class TaskTemplate extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @ManyToOne(() => TaskGroup, (taskGroup) => taskGroup.tasktemplate, {
    onDelete: 'CASCADE',
    nullable: true
  })
  group?: TaskGroup;

}

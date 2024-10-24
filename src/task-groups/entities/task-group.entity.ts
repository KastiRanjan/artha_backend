import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';
import {
  Column,
  Entity, OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity()
export class TaskGroup extends CustomBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(() => TaskTemplate, (task) => task.group, {
    onDelete: 'CASCADE',
    nullable: true
  })
  tasktemplate?: TaskTemplate[];
}

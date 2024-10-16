import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';

@Entity()
export class Worklog extends CustomBaseEntity {
  @Column('text', { nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;


  @ManyToOne(() => UserEntity, (user) => user.worklogs, {
    nullable: false
  })
  @JoinColumn()
  user: UserEntity;


  @ManyToOne(() => Task, (task) => task.worklogs)
  task: Task;
}

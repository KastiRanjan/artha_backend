import { Entity, Column, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from './project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Entity()
export class ProjectTimeline extends CustomBaseEntity {
  @ManyToOne(() => Project, (project) => project.timelines, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 100 })
  action: string; // e.g., 'created', 'task_added', 'task_assigned', etc.

  @Column({ type: 'text', nullable: true })
  details: string; // JSON or text for extra info
}

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from './project.entity';
import { Column, Entity, ManyToOne, Index } from 'typeorm';

@Entity('project_user_assignment')
@Index(['projectId', 'userId', 'assignedDate'])
export class ProjectUserAssignment extends CustomBaseEntity {
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column()
  userId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  assignedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  plannedReleaseDate: Date;

  @Column('text', { nullable: true })
  notes: string;
}

import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Column, Entity, ManyToOne, OneToOne, JoinColumn } from 'typeorm';

@Entity()
export class ProjectSignoff extends CustomBaseEntity {
  @OneToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn()
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  signedOffBy: UserEntity;

  @Column({ nullable: true })
  signedOffById: string;

  // 1. Team fitness for project
  @Column({ type: 'text' })
  teamFitnessRemark: string;

  @Column({ default: true })
  wasTeamFit: boolean;

  // 2. Project completion quality
  @Column({
    type: 'enum',
    enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']
  })
  completionQuality: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';

  @Column({ type: 'text', nullable: true })
  qualityRemark?: string;

  // 3. Project planning and problems
  @Column({ default: false })
  facedProblems: boolean;

  @Column({ type: 'text', nullable: true })
  problemsRemark?: string;

  @Column({ default: true })
  wentAsPlanned: boolean;

  // Future suggestions
  @Column({ type: 'text', nullable: true })
  futureSuggestions?: string;

  @Column({ type: 'timestamp' })
  signoffDate: Date;
}

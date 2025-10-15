import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export type RatingType = 'good' | 'very_good' | 'neutral' | 'poor' | 'bad';

@Entity()
export class ProjectEvaluation extends CustomBaseEntity {
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  projectId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  evaluatedUser: UserEntity;

  @Column()
  evaluatedUserId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  evaluatedBy: UserEntity;

  @Column({ nullable: true })
  evaluatedById: string;

  // Common criteria for all users
  @Column({
    type: 'enum',
    enum: ['good', 'very_good', 'neutral', 'poor', 'bad']
  })
  worklogTime: RatingType;

  @Column({
    type: 'enum',
    enum: ['good', 'very_good', 'neutral', 'poor', 'bad']
  })
  behaviour: RatingType;

  @Column({
    type: 'enum',
    enum: ['good', 'very_good', 'neutral', 'poor', 'bad']
  })
  learning: RatingType;

  @Column({
    type: 'enum',
    enum: ['good', 'very_good', 'neutral', 'poor', 'bad']
  })
  communication: RatingType;

  @Column({
    type: 'enum',
    enum: ['good', 'very_good', 'neutral', 'poor', 'bad']
  })
  accountability: RatingType;

  // Additional criteria for team leads only
  @Column({
    type: 'enum',
    enum: ['good', 'very_good', 'neutral', 'poor', 'bad'],
    nullable: true
  })
  harmony?: RatingType;

  @Column({
    type: 'enum',
    enum: ['good', 'very_good', 'neutral', 'poor', 'bad'],
    nullable: true
  })
  coordination?: RatingType;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Column({ default: false })
  isTeamLead: boolean;
}

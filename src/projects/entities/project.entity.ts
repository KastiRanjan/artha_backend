import { UserEntity } from 'src/auth/entity/user.entity';
import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne
} from 'typeorm';

@Entity()
export class Project extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column('text')
  description: string;

  @Column({ length: 20 })
  status: 'active' | 'suspended' | 'archived' | 'signed_off' = 'active';

  @Column({ length: 30 })
  natureOfWork:
    | 'external_audit'
    | 'tax_compliance'
    | 'accounts_review'
    | 'legal_services'
    | 'financial_projection'
    | 'valuation'
    | 'internal_audit'
    | 'others';

  @Column()
  fiscalYear: number;

  @Column({ type: 'date' })
  startingDate: Date;

  @Column({ type: 'date' })
  endingDate: Date;

  @ManyToMany(() => UserEntity, (user) => user.projects, { nullable: true })
  users: UserEntity[];


  @OneToMany(() => Task, (task) => task.project, {
    onDelete: 'CASCADE',
    nullable: true
  })
  tasks: Task[];

  @OneToMany(() => Worklog, (task) => task.project, {
    onDelete: 'CASCADE',
    nullable: true
  })
  worklogs: Worklog[];

  @ManyToOne(() => UserEntity, (user) => user.projects, {
    onDelete: 'SET NULL',
    nullable: true
  })
  projectLead: UserEntity;
}

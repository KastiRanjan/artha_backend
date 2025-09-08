import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity()
export class Billing extends CustomBaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  shortName: string;

  @Column({ length: 30, nullable: true })
  registration_number: string;

  @Column({ length: 20, nullable: true })
  pan_number: string;

  @Column({ length: 20, nullable: true })
  vat_number: string;

  @Column({ length: 200, nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ nullable: true })
  logo_url: string;

  @Column({ length: 100, nullable: true })
  bank_account_name: string;

  @Column({ length: 100, nullable: true })
  bank_name: string;

  @Column({ length: 50, nullable: true })
  bank_account_number: string;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'archived'],
    default: 'active'
  })
  status: string;

  @OneToMany(() => Project, (project) => project.billing)
  projects: Project[];

  toString() {
    return this.name;
  }
}

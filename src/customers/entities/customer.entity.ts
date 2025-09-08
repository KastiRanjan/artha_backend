import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BoardMember } from './board-member.entity';
import { ManagementTeamMember } from './management-team-member.entity';
import { OtherImportantInfo } from './other-important-info.entity';
import { RegistrationAndLicense } from './registration-and-license.entity';
import { Project } from 'src/projects/entities/project.entity';
import { BusinessSize } from 'src/business-size/entities/business-size.entity';
import { BusinessNature } from 'src/business-nature/entities/business-nature.entity';

@Entity()
export class Customer extends CustomBaseEntity {

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  shortName?: string;

  @Column({ length: 15 })
  panNo: string;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  registeredDate: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'archive'],
    default: 'active'
  })
  status: string;

  @Column({ length: 100 })
  country: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 100 })
  district: string;

  @Column({ length: 100 })
  localJurisdiction: string;

  @Column({ length: 10, nullable: true })
  wardNo?: string;

  @Column({ length: 100 })
  locality: string;

  @Column({
    type: 'enum',
    enum: [
      'private_limited',
      'public_limited',
      'partnership',
      'proprietorship',
      'natural_person',
      'i_ngo',
      'cooperative',
      'government_soe',
      'others'
    ]
  })
  legalStatus: string;

  @Column({
    type: 'enum',
    enum: ['micro', 'cottage', 'small', 'medium', 'large', 'not_applicable'],
    nullable: true
  })
  businessSizeEnum?: string;

  @ManyToOne(() => BusinessSize, { nullable: true })
  @JoinColumn()
  businessSize?: BusinessSize;

  @Column({
    type: 'enum',
    enum: [
      'banking_finance',
      'capital_market_broking',
      'insurance',
      'energy_mining_mineral',
      'manufacturing',
      'agriculture_forestry',
      'construction_real_estate',
      'travel_tourism',
      'research_development',
      'transportation_logistics_management',
      'information_transmission_communication',
      'aviation',
      'computer_electronics',
      'trading_of_goods',
      'personal_service',
      'business_related_service',
      'others'
    ],
    nullable: true
  })
  industryNatureEnum?: string;

  @ManyToOne(() => BusinessNature, { nullable: true })
  @JoinColumn()
  industryNature?: BusinessNature;

  @Column({ length: 15, nullable: true })
  telephoneNo?: string;

  @Column({ length: 15, nullable: true })
  mobileNo?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  webPortal?: string;

  @Column({ length: 100, nullable: true })
  loginUser?: string;

  @Column({ length: 100, nullable: true })
  password?: string;

  @OneToMany(() => Project, (project) => project.customer)
  projects: Project[];

  @OneToMany(
    () => RegistrationAndLicense,
    (registrationAndLicense) => registrationAndLicense.customer
  )
  registrationAndLicenses: RegistrationAndLicense[];

  @OneToMany(() => BoardMember, (boardMember) => boardMember.customer)
  boardMembers: BoardMember[];

  @OneToMany(
    () => ManagementTeamMember,
    (managementTeamMember) => managementTeamMember.customer
  )
  managementTeamMembers: ManagementTeamMember[];

  @OneToMany(
    () => OtherImportantInfo,
    (otherImportantInfo) => otherImportantInfo.customer
  )
  otherImportantInfos: OtherImportantInfo[];

  toString() {
    return this.name;
  }
}

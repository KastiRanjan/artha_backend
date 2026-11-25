import { CustomBaseEntity } from 'src/common/entity/custom-base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BoardMember } from './board-member.entity';
import { ManagementTeamMember } from './management-team-member.entity';
import { OtherImportantInfo } from './other-important-info.entity';
import { RegistrationAndLicense } from './registration-and-license.entity';
import { Project } from 'src/projects/entities/project.entity';
import { BusinessSize } from 'src/business-size/entities/business-size.entity';
import { BusinessNature } from 'src/business-nature/entities/business-nature.entity';
import { LegalStatus } from 'src/legal-status/entities/legal-status.entity';
import { PortalCredential } from './portal-credential.entity';
import { ClientGroup } from 'src/client-groups/entities/client-group.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { ClientTimeline } from './client-timeline.entity';

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

  @Column({ length: 100, nullable: true })
  country?: string;

  @Column({ length: 100, nullable: true })
  state?: string;

  @Column({ length: 100, nullable: true })
  district?: string;

  @Column({ length: 100, nullable: true })
  localJurisdiction?: string;

  @Column({ length: 10, nullable: true })
  wardNo?: string;

  @Column({ length: 100, nullable: true })
  locality?: string;

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
    ],
    nullable: true
  })
  legalStatusEnum?: string;

  @ManyToOne(() => LegalStatus, { nullable: true })
  @JoinColumn()
  legalStatus?: LegalStatus;

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

  @Column({ nullable: true })
  clientGroupId?: string;

  @ManyToOne(() => ClientGroup, (group) => group.customers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientGroupId' })
  clientGroup?: ClientGroup;

  @Column({ nullable: true })
  partnerInChargeId?: string;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'partnerInChargeId' })
  partnerInCharge?: UserEntity;

  @Column({ length: 100, nullable: true })
  bankName?: string;

  @Column({ length: 60, nullable: true })
  bankAccountNumber?: string;

  @Column({ length: 100, nullable: true })
  bankBranch?: string;

  @Column({ type: 'text', nullable: true })
  lastEditReason?: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ length: 120, nullable: true })
  contactPerson?: string;

  @Column({ length: 100, nullable: true })
  contactPersonDesignation?: string;

  @Column({ length: 30, nullable: true })
  contactPersonPhone?: string;

  @Column({ length: 120, nullable: true })
  contactPersonEmail?: string;

  @Column({ nullable: true })
  contactPersonBoardMemberId?: string;

  @Column({ default: false })
  isVatRegistered: boolean;

  @Column({ length: 120, nullable: true })
  taxOffice?: string;

  @Column({ length: 60, nullable: true })
  ocrRegNo?: string;

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

  @OneToMany(
    () => PortalCredential,
    (portalCredential) => portalCredential.customer
  )
  portalCredentials: PortalCredential[];

  @OneToMany(() => ClientTimeline, (timeline) => timeline.customer)
  timelines: ClientTimeline[];

  toString() {
    return this.name;
  }
}

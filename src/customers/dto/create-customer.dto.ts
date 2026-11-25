import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  Length,
  IsUUID,
  IsArray,
  IsBoolean,
  ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreatePortalCredentialDto } from './portal-credential.dto';

const EmptyToUndefined = () =>
  Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value
  );

// Define enums for choices
export enum Status {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVE = 'archive'
}

export enum LegalStatus {
  PRIVATE_LIMITED = 'private_limited',
  PUBLIC_LIMITED = 'public_limited',
  PARTNERSHIP = 'partnership',
  PROPRIETORSHIP = 'proprietorship',
  NATURAL_PERSON = 'natural_person',
  I_NGO = 'i_ngo',
  COOPERATIVE = 'cooperative',
  GOVERNMENT_SOE = 'government_soe',
  OTHERS = 'others'
}

export enum BusinessSize {
  MICRO = 'micro',
  COTTAGE = 'cottage',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  NOT_APPLICABLE = 'not_applicable'
}

export enum IndustryNature {
  BANKING_FINANCE = 'banking_finance',
  CAPITAL_MARKET_BROKING = 'capital_market_broking',
  INSURANCE = 'insurance',
  ENERGY_MINING_MINERAL = 'energy_mining_mineral',
  MANUFACTURING = 'manufacturing',
  AGRICULTURE_FORESTRY = 'agriculture_forestry',
  CONSTRUCTION_REAL_ESTATE = 'construction_real_estate',
  TRAVEL_TOURISM = 'travel_tourism',
  RESEARCH_DEVELOPMENT = 'research_development',
  TRANSPORTATION_LOGISTICS_MANAGEMENT = 'transportation_logistics_management',
  INFORMATION_TRANSMISSION_COMMUNICATION = 'information_transmission_communication',
  AVIATION = 'aviation',
  COMPUTER_ELECTRONICS = 'computer_electronics',
  TRADING_OF_GOODS = 'trading_of_goods',
  PERSONAL_SERVICE = 'personal_service',
  BUSINESS_RELATED_SERVICE = 'business_related_service',
  OTHERS = 'others'
}

export class BoardMemberInputDto {
  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  id?: string;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 100)
  designation: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 15)
  mobileNo?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 15)
  telephoneNo?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsEmail()
  email?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 10)
  extNo?: string;

  @IsOptional()
  @IsBoolean()
  isContactPerson?: boolean;

  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  appointedDate?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  resignedDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCustomerDto {

  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 20)
  shortName?: string;

  @IsString()
  @Length(1, 15)
  panNo: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  registeredDate?: Date; // Optional, handled by server if not provided

  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 100)
  country?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 100)
  state?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 100)
  district?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 100)
  localJurisdiction?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 10)
  wardNo?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 100)
  locality?: string;

  // Both options for legal status
  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(LegalStatus)
  legalStatusEnum?: LegalStatus;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  legalStatusId?: string;

  // Both options for business size
  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(BusinessSize)
  businessSizeEnum?: BusinessSize;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  businessSizeId?: string;

  // Both options for industry nature
  @IsOptional()
  @EmptyToUndefined()
  @IsEnum(IndustryNature)
  industryNatureEnum?: IndustryNature;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  industryNatureId?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 15)
  telephoneNo?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(1, 15)
  mobileNo?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsEmail()
  email?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  website?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  webPortal?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 100)
  loginUser?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 100)
  password?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  clientGroupId?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  partnerInChargeId?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 100)
  bankName?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 60)
  bankAccountNumber?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 100)
  bankBranch?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  lastEditReason?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  about?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 120)
  contactPerson?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 100)
  contactPersonDesignation?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 30)
  contactPersonPhone?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsEmail()
  contactPersonEmail?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsUUID()
  contactPersonBoardMemberId?: string;

  @IsOptional()
  @IsBoolean()
  isVatRegistered?: boolean;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 120)
  taxOffice?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsString()
  @Length(0, 60)
  ocrRegNo?: string;

  @IsOptional()
  @EmptyToUndefined()
  @IsDateString()
  effectiveDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoardMemberInputDto)
  boardMembers?: BoardMemberInputDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePortalCredentialDto)
  portalCredentials?: CreatePortalCredentialDto[];
}

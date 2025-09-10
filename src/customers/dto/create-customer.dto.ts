import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  Length,
  IsUUID
} from 'class-validator';

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

export class CreateCustomerDto {

  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  shortName?: string;

  @IsString()
  @Length(1, 15)
  panNo: string;

  @IsDateString()
  registeredDate?: Date; // Optional, handled by server if not provided

  @IsEnum(Status)
  status: Status;

  @IsString()
  @Length(1, 100)
  country: string;

  @IsString()
  @Length(1, 100)
  state: string;

  @IsString()
  @Length(1, 100)
  district: string;

  @IsString()
  @Length(1, 100)
  localJurisdiction: string;

  @IsOptional()
  @IsString()
  @Length(0, 10)
  wardNo?: string;

  @IsString()
  @Length(1, 100)
  locality: string;

  // Both options for legal status
  @IsOptional()
  @IsEnum(LegalStatus)
  legalStatusEnum?: LegalStatus;

  @IsOptional()
  @IsUUID()
  legalStatusId?: string;

  // Both options for business size
  @IsOptional()
  @IsEnum(BusinessSize)
  businessSizeEnum?: BusinessSize;

  @IsOptional()
  @IsUUID()
  businessSizeId?: string;

  // Both options for industry nature
  @IsOptional()
  @IsEnum(IndustryNature)
  industryNatureEnum?: IndustryNature;

  @IsOptional()
  @IsUUID()
  industryNatureId?: string;

  @IsOptional()
  @IsString()
  @Length(0, 15)
  telephoneNo?: string;

  @IsOptional()
  @IsString()
  @Length(1, 15)
  mobileNo?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  webPortal?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  loginUser?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  password?: string;
}

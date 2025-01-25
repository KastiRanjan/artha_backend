import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsArray,
  IsInt
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum(['active', 'suspended', 'archived', 'signed_off'], {
    message: 'status must be one of: active, suspended, archived, signed_off'
  })
  status: 'active' | 'suspended' | 'archived' | 'signed_off';

  @IsEnum(
    [
      'external_audit',
      'tax_compliance',
      'accounts_review',
      'legal_services',
      'financial_projection',
      'valuation',
      'internal_audit',
      'others'
    ],
    {
      message:
        'natureOfWork must be one of: external_audit, tax_compliance, accounts_review, legal_services, financial_projection, valuation, internal_audit, others'
    }
  )
  natureOfWork:
    | 'external_audit'
    | 'tax_compliance'
    | 'accounts_review'
    | 'legal_services'
    | 'financial_projection'
    | 'valuation'
    | 'internal_audit'
    | 'others';

  @IsNotEmpty()
  @IsInt()
  fiscalYear: number;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  startingDate: Date;

  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  endingDate: Date;

  @IsOptional()
  @IsArray()
  users?: string[]; // Assuming user ids are passed

  @IsOptional()
  projectLead?: string;

  @IsOptional()
  customer?: string;
}

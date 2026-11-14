import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
  IsArray,
  IsInt,
  IsUUID,
  IsBoolean
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(['active', 'suspended', 'archived', 'signed_off', 'completed'], {
    message: 'status must be one of: active, suspended, archived, signed_off, completed'
  })
  status?: 'active' | 'suspended' | 'archived' | 'signed_off' | 'completed';

  @IsNotEmpty()
  @IsUUID()
  natureOfWork: string; // Reference to NatureOfWork entity

  @IsOptional()
  @IsUUID()
  natureOfWorkGroup?: string; // Reference to NatureOfWorkGroup entity (optional)

  @IsOptional()
  @IsInt()
  fiscalYear?: number;

  @IsOptional()
  @IsUUID()
  workingYearId?: string;

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
  projectManager?: string;

  @IsOptional()
  customer?: string;
  
  // For backward compatibility with frontend that uses "client" instead of "customer"
  @IsOptional()
  client?: string;

  @IsOptional()
  billing?: string;

  @IsOptional()
  @IsBoolean()
  allowSubtaskWorklog?: boolean;

  @IsOptional()
  @IsBoolean()
  countsForAvailability?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaymentDone?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaymentTemporarilyEnabled?: boolean;
}

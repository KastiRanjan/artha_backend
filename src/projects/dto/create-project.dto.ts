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

  @IsEnum(['active', 'suspended', 'archived', 'signed_off'], {
    message: 'status must be one of: active, suspended, archived, signed_off'
  })
  status: 'active' | 'suspended' | 'archived' | 'signed_off';

  @IsNotEmpty()
  @IsUUID()
  natureOfWork: string; // Reference to NatureOfWork entity

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

  // Project Manager: Only users with role 'manager' should be assigned
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
}

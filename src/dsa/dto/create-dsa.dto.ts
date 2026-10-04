import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import { DsaType } from '../entities/dsa.entity';

export class CreateDsaDto {
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @IsNotEmpty()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01, { message: 'Requested amount must be greater than 0' })
  requestedAmount: number;

  @IsNotEmpty()
  @IsEnum(DsaType)
  type: DsaType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

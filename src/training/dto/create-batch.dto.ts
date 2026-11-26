import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSessionItemDto {
  @IsNotEmpty()
  @IsNumber()
  sessionNumber: number;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  date: string; // YYYY-MM-DD AD

  @IsOptional()
  @IsString()
  dateNepali?: string; // YYYY-MM-DD BS

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  venueOrLink?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateBatchDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsString()
  batchName: string;

  @IsOptional()
  @IsString()
  deliveryMode?: 'in_person' | 'virtual' | 'hybrid' | 'self_paced';

  @IsOptional()
  @IsString()
  venueOrLink?: string;

  @IsOptional()
  @IsNumber()
  maxCapacity?: number;

  @IsOptional()
  @IsUUID()
  internalTrainerId?: string;

  @IsOptional()
  @IsString()
  externalTrainerName?: string;

  @IsOptional()
  @IsString()
  externalTrainerOrg?: string;

  @IsNotEmpty()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  startDateNepali?: string;

  @IsOptional()
  @IsString()
  endDateNepali?: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSessionItemDto)
  sessions?: CreateSessionItemDto[];
}

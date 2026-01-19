import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsBoolean
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportAccessStatus } from '../entities/client-report.entity';

export class CreateClientReportDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  })
  @IsNumber()
  fiscalYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' ? true : value === 'false' ? false : value;
    }
    return value;
  })
  @IsBoolean()
  isVisible?: boolean;
}

export class UpdateClientReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ReportAccessStatus)
  accessStatus?: ReportAccessStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' ? true : value === 'false' ? false : value;
    }
    return value;
  })
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fiscalYear?: number;
}

export class UpdateReportAccessDto {
  @ApiProperty()
  @IsEnum(ReportAccessStatus)
  accessStatus: ReportAccessStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessNotes?: string;
}

export class ClientReportFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ReportAccessStatus)
  accessStatus?: ReportAccessStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  fiscalYear?: number;
}

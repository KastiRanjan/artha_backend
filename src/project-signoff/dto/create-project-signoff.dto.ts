import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProjectSignoffDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  teamFitnessRemark: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  wasTeamFit: boolean;

  @ApiProperty({
    enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']
  })
  @IsNotEmpty()
  @IsEnum(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'])
  completionQuality: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualityRemark?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  facedProblems: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  problemsRemark?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  wentAsPlanned: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  futureSuggestions?: string;
}

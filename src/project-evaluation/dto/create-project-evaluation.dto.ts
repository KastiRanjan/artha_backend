import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { RatingType } from '../entities/project-evaluation.entity';

export class CreateProjectEvaluationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  evaluatedUserId: string;

  @ApiProperty({ enum: ['good', 'very_good', 'neutral', 'poor', 'bad'] })
  @IsNotEmpty()
  @IsEnum(['good', 'very_good', 'neutral', 'poor', 'bad'])
  worklogTime: RatingType;

  @ApiProperty({ enum: ['good', 'very_good', 'neutral', 'poor', 'bad'] })
  @IsNotEmpty()
  @IsEnum(['good', 'very_good', 'neutral', 'poor', 'bad'])
  behaviour: RatingType;

  @ApiProperty({ enum: ['good', 'very_good', 'neutral', 'poor', 'bad'] })
  @IsNotEmpty()
  @IsEnum(['good', 'very_good', 'neutral', 'poor', 'bad'])
  learning: RatingType;

  @ApiProperty({ enum: ['good', 'very_good', 'neutral', 'poor', 'bad'] })
  @IsNotEmpty()
  @IsEnum(['good', 'very_good', 'neutral', 'poor', 'bad'])
  communication: RatingType;

  @ApiProperty({ enum: ['good', 'very_good', 'neutral', 'poor', 'bad'] })
  @IsNotEmpty()
  @IsEnum(['good', 'very_good', 'neutral', 'poor', 'bad'])
  accountability: RatingType;

  @ApiPropertyOptional({ enum: ['good', 'very_good', 'neutral', 'poor', 'bad'] })
  @IsOptional()
  @IsEnum(['good', 'very_good', 'neutral', 'poor', 'bad'])
  harmony?: RatingType;

  @ApiPropertyOptional({ enum: ['good', 'very_good', 'neutral', 'poor', 'bad'] })
  @IsOptional()
  @IsEnum(['good', 'very_good', 'neutral', 'poor', 'bad'])
  coordination?: RatingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

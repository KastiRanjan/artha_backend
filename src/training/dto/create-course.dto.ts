import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  level?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsNumber()
  cpdHours?: number;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsArray()
  targetRoles?: string[];

  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @IsOptional()
  @IsString()
  prerequisites?: string;

  @IsOptional()
  @IsString()
  materialsUrl?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'draft' | 'archived';

  @IsOptional()
  @IsString()
  courseType?: 'self_paced' | 'instructor_led' | 'hybrid';

  @IsOptional()
  @IsBoolean()
  allowSelfEnrollment?: boolean;

  @IsOptional()
  @IsBoolean()
  strictSystemOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  sequentialLock?: boolean;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsString()
  instructorId?: string;
}

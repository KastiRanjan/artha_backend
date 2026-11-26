import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateModuleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['video', 'pdf', 'document', 'rich_text', 'quiz'])
  contentType: 'video' | 'pdf' | 'document' | 'rich_text' | 'quiz';

  @IsOptional()
  @IsString()
  richTextContent?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsNumber()
  passingScore?: number;
}

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['video', 'pdf', 'document', 'rich_text', 'quiz'])
  contentType?: 'video' | 'pdf' | 'document' | 'rich_text' | 'quiz';

  @IsOptional()
  @IsString()
  richTextContent?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsNumber()
  passingScore?: number;
}

export class UpsertAccessPolicyDto {
  @IsIn(['always', 'allow_window', 'ban_window'])
  mode: 'always' | 'allow_window' | 'ban_window';

  @IsOptional()
  @IsArray()
  allowedDays?: number[];

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsArray()
  exemptRoles?: string[];

  @IsOptional()
  @IsString()
  validFromDate?: string;

  @IsOptional()
  @IsString()
  validUntilDate?: string;

  @IsOptional()
  @IsString()
  policyNote?: string;
}

export class AdminEnrollCourseDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsOptional()
  @IsString()
  dueDate?: string;
}

export class UpdateLessonProgressDto {
  @IsOptional()
  @IsIn(['not_started', 'in_progress', 'completed'])
  status?: 'not_started' | 'in_progress' | 'completed';

  @IsOptional()
  @IsNumber()
  @Min(0)
  lastPositionSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  watchedSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpentSeconds?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercent?: number;
}

export class CreateQuizQuestionDto {
  @IsNotEmpty()
  @IsString()
  questionText: string;

  @IsOptional()
  @IsIn(['single', 'multiple'])
  questionType?: 'single' | 'multiple';

  @IsArray()
  options: Array<{ id: string; text: string; isCorrect: boolean }>;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class SubmitQuizAttemptDto {
  @IsNotEmpty()
  answers: Record<string, string[]>;
}

export class CreateLessonCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

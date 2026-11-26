import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitFeedbackDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  contentRating: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  trainerRating: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  suggestions?: string;
}

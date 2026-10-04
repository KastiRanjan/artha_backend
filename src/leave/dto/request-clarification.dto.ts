import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestClarificationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5, { message: 'Clarification notes must be at least 5 characters long' })
  notes: string;
}

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RespondClarificationDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'Clarification response must be at least 2 characters long' })
  response: string;
}

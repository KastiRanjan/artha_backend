import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class FirstVerifyTaskDto {
  @IsArray()
  @IsNotEmpty()
  taskIds: number[];

  @IsString()
  @IsNotEmpty()
  firstVerifiedBy: string;
}
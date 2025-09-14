import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SecondVerifyTaskDto {
  @IsArray()
  @IsNotEmpty()
  taskIds: number[];

  @IsString()
  @IsNotEmpty()
  secondVerifiedBy: string;
}
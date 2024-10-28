import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty } from 'class-validator';

export class ImportTaskDto {
  @IsNotEmpty()
  @IsArray()
  readonly tasks: {
    groupId: string;
    name: string;
    description?: string;
  }[];

  @IsNotEmpty()
  @Type(() => String)
  readonly project: string;

  @Optional()
  readonly groupId: string;
}

import { Type } from 'class-transformer';
import {
    IsArray,
    IsNotEmpty
} from 'class-validator';

export class ImportTaskDto {
  @IsNotEmpty()
  @IsArray()
  @Type(() => String)
  readonly name: string[];
}


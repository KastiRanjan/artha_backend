import { IsString, Length } from 'class-validator';

export class CreateNatureOfWorkDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @Length(1, 20)
  shortName: string;
}
